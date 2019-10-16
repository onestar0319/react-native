/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Scheduler.h"

#include <glog/logging.h>
#include <jsi/jsi.h>

#include <react/core/LayoutContext.h>
#include <react/debug/SystraceSection.h>
#include <react/uimanager/ComponentDescriptorRegistry.h>
#include <react/uimanager/UIManager.h>
#include <react/uimanager/UIManagerBinding.h>
#include <react/uimanager/UITemplateProcessor.h>

namespace facebook {
namespace react {

Scheduler::Scheduler(
    SchedulerToolbox schedulerToolbox,
    SchedulerDelegate *delegate) {
  runtimeExecutor_ = schedulerToolbox.runtimeExecutor;

  reactNativeConfig_ =
      schedulerToolbox.contextContainer
          ->at<std::shared_ptr<const ReactNativeConfig>>("ReactNativeConfig");

  auto uiManager = std::make_shared<UIManager>();
  auto eventOwnerBox = std::make_shared<EventBeat::OwnerBox>();

  auto eventPipe = [=](jsi::Runtime &runtime,
                       const EventTarget *eventTarget,
                       const std::string &type,
                       const ValueFactory &payloadFactory) {
    uiManager->visitBinding([&](UIManagerBinding const &uiManagerBinding) {
      uiManagerBinding.dispatchEvent(
          runtime, eventTarget, type, payloadFactory);
    });
  };

  auto statePipe = [=](const StateData::Shared &data,
                       const StateTarget &stateTarget) {
    uiManager->updateState(
        stateTarget.getShadowNode().shared_from_this(), data);
  };

  eventDispatcher_ = std::make_shared<EventDispatcher>(
      eventPipe,
      statePipe,
      schedulerToolbox.synchronousEventBeatFactory,
      schedulerToolbox.asynchronousEventBeatFactory,
      eventOwnerBox);

  eventOwnerBox->owner = eventDispatcher_;

  componentDescriptorRegistry_ = schedulerToolbox.componentRegistryFactory(
      eventDispatcher_, schedulerToolbox.contextContainer);

  rootComponentDescriptor_ =
      std::make_unique<const RootComponentDescriptor>(eventDispatcher_);

  uiManager->setDelegate(this);
  uiManager->setComponentDescriptorRegistry(componentDescriptorRegistry_);

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    auto uiManagerBinding = UIManagerBinding::createAndInstallIfNeeded(runtime);
    uiManagerBinding->attach(uiManager);
  });

  schedulerToolbox.contextContainer->insert(
      "ComponentDescriptorRegistry_DO_NOT_USE_PRETTY_PLEASE",
      std::weak_ptr<ComponentDescriptorRegistry const>(
          componentDescriptorRegistry_));

  delegate_ = delegate;
  uiManager_ = uiManager;
}

Scheduler::~Scheduler() {
  uiManager_->setDelegate(nullptr);
}

void Scheduler::startSurface(
    SurfaceId surfaceId,
    const std::string &moduleName,
    const folly::dynamic &initialProps,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::startSurface");

  auto shadowTree = std::make_unique<ShadowTree>(
      surfaceId, layoutConstraints, layoutContext, *rootComponentDescriptor_);
  shadowTree->setDelegate(this);

  auto uiManager = uiManager_;

  uiManager->getShadowTreeRegistry().add(std::move(shadowTree));

  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManager->visitBinding([&](UIManagerBinding const &uiManagerBinding) {
      uiManagerBinding.startSurface(
          runtime, surfaceId, moduleName, initialProps);
    });
  });
}

void Scheduler::renderTemplateToSurface(
    SurfaceId surfaceId,
    const std::string &uiTemplate) {
  SystraceSection s("Scheduler::renderTemplateToSurface");
  try {
    if (uiTemplate.size() == 0) {
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
          return shadowTree.tryCommit([&](const SharedRootShadowNode
                                              &oldRootShadowNode) {
            return std::make_shared<RootShadowNode>(
                *oldRootShadowNode,
                ShadowNodeFragment{
                    /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
                    /* .surfaceId = */
                    ShadowNodeFragment::surfaceIdPlaceholder(),
                    /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                    /* .eventEmitter = */
                    ShadowNodeFragment::eventEmitterPlaceholder(),
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

  // Note, we have to do in inside `visit` function while the Shadow Tree
  // is still being registered.
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [](ShadowTree const &shadowTree) {
        // As part of stopping a Surface, we need to properly destroy all
        // mounted views, so we need to commit an empty tree to trigger all
        // side-effects that will perform that.
        shadowTree.commitEmptyTree();
      });

  // Waiting for all concurrent commits to be finished and unregistering the
  // `ShadowTree`.
  uiManager_->getShadowTreeRegistry().remove(surfaceId);

  // We execute JavaScript/React part of the process at the very end to minimize
  // any visible side-effects of stopping the Surface. Any possible commits from
  // the JavaScript side will not be able to reference a `ShadowTree` and will
  // fail silently.
  auto uiManager = uiManager_;
  runtimeExecutor_([=](jsi::Runtime &runtime) {
    uiManager->visitBinding([&](UIManagerBinding const &uiManagerBinding) {
      uiManagerBinding.stopSurface(runtime, surfaceId);
    });
  });
}

Size Scheduler::measureSurface(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::measureSurface");

  Size size;
  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        shadowTree.tryCommit(
            [&](const SharedRootShadowNode &oldRootShadowNode) {
              auto rootShadowNode =
                  oldRootShadowNode->clone(layoutConstraints, layoutContext);
              rootShadowNode->layout();
              size = rootShadowNode->getLayoutMetrics().frame.size;
              return nullptr;
            });
      });
  return size;
}

void Scheduler::constraintSurfaceLayout(
    SurfaceId surfaceId,
    const LayoutConstraints &layoutConstraints,
    const LayoutContext &layoutContext) const {
  SystraceSection s("Scheduler::constraintSurfaceLayout");

  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        shadowTree.commit([&](const SharedRootShadowNode &oldRootShadowNode) {
          return oldRootShadowNode->clone(layoutConstraints, layoutContext);
        });
      });
}

const ComponentDescriptor &Scheduler::getComponentDescriptor(
    ComponentHandle handle) {
  return componentDescriptorRegistry_->at(handle);
}

#pragma mark - Delegate

void Scheduler::setDelegate(SchedulerDelegate *delegate) {
  delegate_ = delegate;
}

SchedulerDelegate *Scheduler::getDelegate() const {
  return delegate_;
}

#pragma mark - ShadowTreeDelegate

void Scheduler::shadowTreeDidCommit(
    ShadowTree const &shadowTree,
    MountingCoordinator::Shared const &mountingCoordinator) const {
  SystraceSection s("Scheduler::shadowTreeDidCommit");

  if (delegate_) {
    delegate_->schedulerDidFinishTransaction(mountingCoordinator);
  }
}

#pragma mark - UIManagerDelegate

void Scheduler::uiManagerDidFinishTransaction(
    SurfaceId surfaceId,
    const SharedShadowNodeUnsharedList &rootChildNodes) {
  SystraceSection s("Scheduler::uiManagerDidFinishTransaction");

  uiManager_->getShadowTreeRegistry().visit(
      surfaceId, [&](const ShadowTree &shadowTree) {
        shadowTree.commit([&](const SharedRootShadowNode &oldRootShadowNode) {
          return std::make_shared<RootShadowNode>(
              *oldRootShadowNode,
              ShadowNodeFragment{
                  /* .tag = */ ShadowNodeFragment::tagPlaceholder(),
                  /* .surfaceId = */ ShadowNodeFragment::surfaceIdPlaceholder(),
                  /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                  /* .eventEmitter = */
                  ShadowNodeFragment::eventEmitterPlaceholder(),
                  /* .children = */ rootChildNodes,
              });
        });
      });
}

void Scheduler::uiManagerDidCreateShadowNode(
    const SharedShadowNode &shadowNode) {
  SystraceSection s("Scheduler::uiManagerDidCreateShadowNode");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidRequestPreliminaryViewAllocation(
        shadowNode->getSurfaceId(), shadowView);
  }
}

void Scheduler::uiManagerDidDispatchCommand(
    const SharedShadowNode &shadowNode,
    std::string const &commandName,
    folly::dynamic const args) {
  SystraceSection s("Scheduler::uiManagerDispatchCommand");

  if (delegate_) {
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidDispatchCommand(shadowView, commandName, args);
  }
}

/*
 * Set JS responder for a view
 */
void Scheduler::uiManagerDidSetJSResponder(
    SurfaceId surfaceId,
    const SharedShadowNode &shadowNode,
    bool blockNativeResponder) {
  if (delegate_) {
    // TODO: the first shadowView paramenter, should be the first parent that
    // is non virtual.
    auto shadowView = ShadowView(*shadowNode);
    delegate_->schedulerDidSetJSResponder(
        surfaceId, shadowView, shadowView, blockNativeResponder);
  }
}

/*
 * Clear the JSResponder for a view
 */
void Scheduler::uiManagerDidClearJSResponder() {
  if (delegate_) {
    delegate_->schedulerDidClearJSResponder();
  }
}

} // namespace react
} // namespace facebook
