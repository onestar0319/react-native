/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Scheduler.h"

#include <glog/logging.h>
#include <jsi/jsi.h>

#include <react/debug/react_native_assert.h>
#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/Constants.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/debug/SystraceSection.h>
#include <react/renderer/mounting/MountingOverrideDelegate.h>
#include <react/renderer/mounting/ShadowViewMutation.h>
#include <react/renderer/templateprocessor/UITemplateProcessor.h>
#include <react/renderer/uimanager/UIManager.h>
#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_SHADOW_TREE_INTROSPECTION
#include <react/renderer/mounting/stubs.h>
#include <iostream>
#endif

namespace facebook {
namespace react {

Scheduler::Scheduler(
    SchedulerToolbox schedulerToolbox,
    UIManagerAnimationDelegate *animationDelegate,
    SchedulerDelegate *delegate)
    : surfaceManager_(*this) {
  runtimeExecutor_ = schedulerToolbox.runtimeExecutor;

  reactNativeConfig_ =
      schedulerToolbox.contextContainer
          ->at<std::shared_ptr<const ReactNativeConfig>>("ReactNativeConfig");

  // Creating a container for future `EventDispatcher` instance.
  eventDispatcher_ =
      std::make_shared<better::optional<EventDispatcher const>>();

  auto uiManager = std::make_shared<UIManager>();
  auto eventOwnerBox = std::make_shared<EventBeat::OwnerBox>();
  eventOwnerBox->owner = eventDispatcher_;

  auto eventPipe = [uiManager](
                       jsi::Runtime &runtime,
                       const EventTarget *eventTarget,
                       const std::string &type,
                       const ValueFactory &payloadFactory) {
    uiManager->visitBinding(
        [&](UIManagerBinding const &uiManagerBinding) {
          uiManagerBinding.dispatchEvent(
              runtime, eventTarget, type, payloadFactory);
        },
        runtime);
  };

  auto statePipe = [uiManager](StateUpdate const &stateUpdate) {
    uiManager->updateState(stateUpdate);
  };

  // Creating an `EventDispatcher` instance inside the already allocated
  // container (inside the optional).
  eventDispatcher_->emplace(
      eventPipe,
      statePipe,
      schedulerToolbox.synchronousEventBeatFactory,
      schedulerToolbox.asynchronousEventBeatFactory,
      eventOwnerBox);

  // Casting to `std::shared_ptr<EventDispatcher const>`.
  auto eventDispatcher =
      EventDispatcher::Shared{eventDispatcher_, &eventDispatcher_->value()};

  componentDescriptorRegistry_ = schedulerToolbox.componentRegistryFactory(
      eventDispatcher, schedulerToolbox.contextContainer);

  uiManager->setBackgroundExecutor(schedulerToolbox.backgroundExecutor);
  uiManager->setDelegate(this);
  uiManager->setRuntimeExecutor(runtimeExecutor_);
  uiManager->setComponentDescriptorRegistry(componentDescriptorRegistry_);

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    auto uiManagerBinding = UIManagerBinding::createAndInstallIfNeeded(runtime);
    uiManagerBinding->attach(uiManager);
  });

  auto componentDescriptorRegistryKey =
      "ComponentDescriptorRegistry_DO_NOT_USE_PRETTY_PLEASE";
  schedulerToolbox.contextContainer->erase(componentDescriptorRegistryKey);
  schedulerToolbox.contextContainer->insert(
      componentDescriptorRegistryKey,
      std::weak_ptr<ComponentDescriptorRegistry const>(
          componentDescriptorRegistry_));

  delegate_ = delegate;
  commitHooks_ = schedulerToolbox.commitHooks;
  uiManager_ = uiManager;

  for (auto commitHook : commitHooks_) {
    uiManager->registerCommitHook(*commitHook);
  }

  if (animationDelegate != nullptr) {
    animationDelegate->setComponentDescriptorRegistry(
        componentDescriptorRegistry_);
  }
  uiManager_->setAnimationDelegate(animationDelegate);

#ifdef ANDROID
  removeOutstandingSurfacesOnDestruction_ = reactNativeConfig_->getBool(
      "react_fabric:remove_outstanding_surfaces_on_destruction_android");
  Constants::setPropsForwardingEnabled(reactNativeConfig_->getBool(
      "react_fabric:enable_props_forwarding_android"));
  enableSurfaceManager_ = reactNativeConfig_->getBool(
      "react_fabric:enable_surface_manager_android");
#else
  removeOutstandingSurfacesOnDestruction_ = reactNativeConfig_->getBool(
      "react_fabric:remove_outstanding_surfaces_on_destruction_ios");
  enableSurfaceManager_ =
      reactNativeConfig_->getBool("react_fabric:enable_surface_manager_ios");
#endif

  uiManager->extractUIManagerBindingOnDemand_ = reactNativeConfig_->getBool(
      "react_fabric:extract_uimanagerbinding_on_demand");
}

Scheduler::~Scheduler() {
  LOG(WARNING) << "Scheduler::~Scheduler() was called (address: " << this
               << ").";

  for (auto commitHook : commitHooks_) {
    uiManager_->unregisterCommitHook(*commitHook);
  }

  // All Surfaces must be explicitly stopped before destroying `Scheduler`.
  // The idea is that `UIManager` is allowed to call `Scheduler` only if the
  // corresponding `ShadowTree` instance exists.

  // The thread-safety of this operation is guaranteed by this requirement.
  uiManager_->setDelegate(nullptr);
  uiManager_->setAnimationDelegate(nullptr);

  // Then, let's verify that the requirement was satisfied.
  auto surfaceIds = std::vector<SurfaceId>{};
  uiManager_->getShadowTreeRegistry().enumerate(
      [&](ShadowTree const &shadowTree, bool &stop) {
        surfaceIds.push_back(shadowTree.getSurfaceId());
      });

  react_native_assert(
      surfaceIds.empty() &&
      "Scheduler was destroyed with outstanding Surfaces.");

  if (surfaceIds.empty()) {
    return;
  }

  LOG(ERROR) << "Scheduler was destroyed with outstanding Surfaces.";

  // If we are here, that means assert didn't fire which indicates that we in
  // production.

  // Now we have still-running surfaces, which is no good, no good.
  // That's indeed a sign of a severe issue on the application layer.
  // At this point, we don't have much to lose, so we are trying to unmount all
  // outstanding `ShadowTree`s to prevent all stored JSI entities from
  // overliving the `Scheduler`. (Unmounting `ShadowNode`s disables
  // `EventEmitter`s which destroys JSI objects.)
  for (auto surfaceId : surfaceIds) {
    uiManager_->getShadowTreeRegistry().visit(
        surfaceId,
        [](ShadowTree const &shadowTree) { shadowTree.commitEmptyTree(); });

    // Removing surfaces is gated because it acquires mutex waiting for commits
    // in flight; in theory, it can deadlock.
    if (removeOutstandingSurfacesOnDestruction_) {
      uiManager_->getShadowTreeRegistry().remove(surfaceId);
    }
  }
}

void Scheduler::registerSurface(
    SurfaceHandler const &surfaceHandler) const noexcept {
  surfaceHandler.setUIManager(uiManager_.get());
}

void Scheduler::unregisterSurface(
    SurfaceHandler const &surfaceHandler) const noexcept {
  surfaceHandler.setUIManager(nullptr);
}

void Scheduler::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::startSurface");

  if (enableSurfaceManager_) {
    surfaceManager_.startSurface(
        surfaceId, moduleName, initialProps, layoutConstraints, layoutContext);
    return;
  }

  auto shadowTree = std::make_unique<ShadowTree>(
      surfaceId, layoutConstraints, layoutContext, *uiManager_);

  auto uiManager = uiManager_;

  uiManager->getShadowTreeRegistry().add(std::move(shadowTree));

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManager->visitBinding(
        [&](UIManagerBinding const &uiManagerBinding) {
          uiManagerBinding.startSurface(
              runtime, surfaceId, moduleName, initialProps);
        },
        runtime);
  });
}

void Scheduler::renderTemplateToSurface(
    SurfaceId surfaceId,
    const std::string &uiTemplate) {
  SystraceSection s("Scheduler::renderTemplateToSurface");
  try {
    if (uiTemplate.empty()) {
      return;
    }
    NativeModuleRegistry nMR;
    auto tree = UITemplateProcessor::buildShadowTree(
        uiTemplate,
        surfaceId,
        folly::dynamic::object(),
        *componentDescriptorRegistry_,
        nMR,
        reactNativeConfig_);

    uiManager_->getShadowTreeRegistry().visit(
        surfaceId, [=](const ShadowTree &shadowTree) {
          return shadowTree.tryCommit(
              [&](RootShadowNode const &oldRootShadowNode) {
                return std::make_shared<RootShadowNode>(
                    oldRootShadowNode,
                    ShadowNodeFragment{
                        /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                        /* .children = */
                        std::make_shared<SharedShadowNodeList>(
                            SharedShadowNodeList{tree}),
                    });
              });
        });
  } catch (const std::exception &e) {
    LOG(ERROR) << "    >>>> EXCEPTION <<<  rendering uiTemplate in "
               << "Scheduler::renderTemplateToSurface: " << e.what();
  }
}

void Scheduler::stopSurface(SurfaceId surfaceId) const {
  SystraceSection s("Scheduler::stopSurface");

  if (enableSurfaceManager_) {
    surfaceManager_.stopSurface(surfaceId);
    return;
  }

  // Stop any ongoing animations.
  uiManager_->stopSurfaceForAnimationDelegate(surfaceId);

  // Waiting for all concurrent commits to be finished and unregistering the
  // `ShadowTree`.
  auto shadowTree = uiManager_->getShadowTreeRegistry().remove(surfaceId);

  // As part of stopping a Surface, we need to properly destroy all
  // mounted views, so we need to commit an empty tree to trigger all
  // side-effects (including destroying and removing mounted views).
  if (shadowTree) {
    shadowTree->commitEmptyTree();
  }

  // We execute JavaScript/React part of the process at the very end to minimize
  // any visible side-effects of stopping the Surface. Any possible commits from
  // the JavaScript side will not be able to reference a `ShadowTree` and will
  // fail silently.
  auto uiManager = uiManager_;
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManager->visitBinding(
        [&](UIManagerBinding const &uiManagerBinding) {
          uiManagerBinding.stopSurface(runtime, surfaceId);
        },
        runtime);
  });
}

Size Scheduler::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::measureSurface");

  if (enableSurfaceManager_) {
    return surfaceManager_.measureSurface(
        surfaceId, layoutConstraints, layoutContext);
  }

  auto currentRootShadowNode = RootShadowNode::Shared{};
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        currentRootShadowNode = shadowTree.getCurrentRevision().rootShadowNode;
      });

  auto rootShadowNode =
      currentRootShadowNode->clone(layoutConstraints, layoutContext);
  rootShadowNode->layoutIfNeeded();
  return rootShadowNode->getLayoutMetrics().frame.size;
}

MountingCoordinator::Shared Scheduler::findMountingCoordinator(
    SurfaceId surfaceId) const {
  if (enableSurfaceManager_) {
    return surfaceManager_.findMountingCoordinator(surfaceId);
  }

  MountingCoordinator::Shared mountingCoordinator = nullptr;
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        mountingCoordinator = shadowTree.getMountingCoordinator();
      });
  return mountingCoordinator;
}

void Scheduler::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  if (enableSurfaceManager_) {
    return surfaceManager_.constraintSurfaceLayout(
        surfaceId, layoutConstraints, layoutContext);
  }

  SystraceSection s("Scheduler::constraintSurfaceLayout");

  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](ShadowTree const &shadowTree) {
        shadowTree.commit([&](RootShadowNode const &oldRootShadowNode) {
          return oldRootShadowNode.clone(layoutConstraints, layoutContext);
        });
      });
}

ComponentDescriptor const *
Scheduler::findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(
    ComponentHandle handle) const {
  return componentDescriptorRegistry_
      ->findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN(handle);
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - UIManagerAnimationDelegate

void Scheduler::animationTick() const {
  uiManager_->animationTick();
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(
    MountingCoordinator::Shared const &mountingCoordinator) {
  SystraceSection s("Scheduler::uiManagerDidFinishTransaction");

  if (delegate_) {
    delegate_->schedulerDidFinishTransaction(mountingCoordinator);
  }
}
void Scheduler::uiManagerDidCreateShadowNode(
    const ShadowNode::Shared &shadowNode) {
  SystraceSection s("Scheduler::uiManagerDidCreateShadowNode");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode->getSurfaceId(), shadowView);
  }
}

void Scheduler::uiManagerDidDispatchCommand(
    const ShadowNode::Shared &shadowNode,
    std::string const &commandName,
    folly::dynamic const args) {
  SystraceSection s("Scheduler::uiManagerDispatchCommand");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidDispatchCommand(shadowView, commandName, args);
  }
}

void Scheduler::uiManagerDidSendAccessibilityEvent(
    const ShadowNode::Shared &shadowNode,
    std::string const &eventType) {
  SystraceSection s("Scheduler::uiManagerDidSendAccessibilityEvent");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidSendAccessibilityEvent(shadowView, eventType);
  }
}

/*
 * Set JS responder for a view.
 */
void Scheduler::uiManagerDidSetIsJSResponder(
    ShadowNode::Shared const &shadowNode,
    bool isJSResponder) {
  if (delegate_) {
    delegate_->schedulerDidSetIsJSResponder(
        ShadowView(*shadowNode), isJSResponder);
  }
}

} // namespace react
} // namespace facebook
