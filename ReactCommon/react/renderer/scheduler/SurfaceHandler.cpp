/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceHandler.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/scheduler/Scheduler.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook {
namespace react {

using Status = SurfaceHandler::Status;
using DisplayMode = SurfaceHandler::DisplayMode;

SurfaceHandler::SurfaceHandler(
    std::string const &moduleName,
    SurfaceId surfaceId) noexcept {
  parameters_.moduleName = moduleName;
  parameters_.surfaceId = surfaceId;
}

SurfaceHandler::SurfaceHandler(SurfaceHandler &&other) noexcept {
  operator=(std::move(other));
}

SurfaceHandler &SurfaceHandler::operator=(SurfaceHandler &&other) noexcept {
  std::unique_lock<better::shared_mutex> lock1(linkMutex_, std::defer_lock);
  std::unique_lock<better::shared_mutex> lock2(
      parametersMutex_, std::defer_lock);
  std::unique_lock<better::shared_mutex> lock3(
      other.linkMutex_, std::defer_lock);
  std::unique_lock<better::shared_mutex> lock4(
      other.parametersMutex_, std::defer_lock);
  std::lock(lock1, lock2, lock3, lock4);

  link_ = other.link_;
  parameters_ = other.parameters_;

  other.link_ = Link{};
  other.parameters_ = Parameters{};
  return *this;
}

#pragma mark - Surface Life-Cycle Management

Status SurfaceHandler::getStatus() const noexcept {
  std::shared_lock<better::shared_mutex> lock(linkMutex_);
  return link_.status;
}

void SurfaceHandler::start() const noexcept {
  {
    std::unique_lock<better::shared_mutex> lock(linkMutex_);
    react_native_assert(
        link_.status == Status::Registered && "Surface must be registered.");
    react_native_assert(
        getLayoutConstraints().layoutDirection != LayoutDirection::Undefined &&
        "layoutDirection must be set.");

    auto parameters = Parameters{};
    {
      std::shared_lock<better::shared_mutex> parametersLock(parametersMutex_);
      parameters = parameters_;
    }

    link_.shadowTree = &link_.uiManager->startSurface(
        parameters.surfaceId,
        parameters.moduleName,
        parameters.props,
        parameters.layoutConstraints,
        parameters.layoutContext);

    link_.status = Status::Running;

    applyDisplayMode(parameters.displayMode);
  }
}

void SurfaceHandler::stop() const noexcept {
  std::unique_lock<better::shared_mutex> lock(linkMutex_);
  react_native_assert(
      link_.status == Status::Running && "Surface must be running.");

  link_.status = Status::Registered;
  link_.shadowTree = nullptr;
  link_.uiManager->stopSurface(parameters_.surfaceId);
}

void SurfaceHandler::setDisplayMode(DisplayMode displayMode) const noexcept {
  {
    std::unique_lock<better::shared_mutex> lock(parametersMutex_);
    if (parameters_.displayMode == displayMode) {
      return;
    }

    parameters_.displayMode = displayMode;
  }

  {
    std::shared_lock<better::shared_mutex> lock(linkMutex_);

    if (link_.status != Status::Running) {
      return;
    }

    applyDisplayMode(displayMode);
  }
}

DisplayMode SurfaceHandler::getDisplayMode() const noexcept {
  std::shared_lock<better::shared_mutex> lock(parametersMutex_);
  return parameters_.displayMode;
}

#pragma mark - Accessors

SurfaceId SurfaceHandler::getSurfaceId() const noexcept {
  std::shared_lock<better::shared_mutex> lock(parametersMutex_);
  return parameters_.surfaceId;
}

std::string SurfaceHandler::getModuleName() const noexcept {
  std::shared_lock<better::shared_mutex> lock(parametersMutex_);
  return parameters_.moduleName;
}

void SurfaceHandler::setProps(folly::dynamic const &props) const noexcept {
  std::unique_lock<better::shared_mutex> lock(parametersMutex_);
  parameters_.props = props;
}

folly::dynamic SurfaceHandler::getProps() const noexcept {
  std::shared_lock<better::shared_mutex> lock(parametersMutex_);
  return parameters_.props;
}

std::shared_ptr<MountingCoordinator const>
SurfaceHandler::getMountingCoordinator() const noexcept {
  std::shared_lock<better::shared_mutex> lock(linkMutex_);
  react_native_assert(
      link_.status != Status::Unregistered && "Surface must be registered.");
  react_native_assert(
      link_.shadowTree && "`link_.shadowTree` must not be null.");
  return link_.shadowTree->getMountingCoordinator();
}

#pragma mark - Layout

Size SurfaceHandler::measure(
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const noexcept {
  std::shared_lock<better::shared_mutex> lock(linkMutex_);

  if (link_.status != Status::Running) {
    return layoutConstraints.clamp({0, 0});
  }

  react_native_assert(
      link_.shadowTree && "`link_.shadowTree` must not be null.");

  auto currentRootShadowNode =
      link_.shadowTree->getCurrentRevision().rootShadowNode;

  auto rootShadowNode =
      currentRootShadowNode->clone(layoutConstraints, layoutContext);
  rootShadowNode->layoutIfNeeded();
  return rootShadowNode->getLayoutMetrics().frame.size;
}

void SurfaceHandler::constraintLayout(
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext) const noexcept {
  {
    std::unique_lock<better::shared_mutex> lock(parametersMutex_);

    if (parameters_.layoutConstraints == layoutConstraints &&
        parameters_.layoutContext == layoutContext) {
      return;
    }

    parameters_.layoutConstraints = layoutConstraints;
    parameters_.layoutContext = layoutContext;
  }

  {
    std::shared_lock<better::shared_mutex> lock(linkMutex_);

    if (link_.status != Status::Running) {
      return;
    }

    react_native_assert(
        link_.shadowTree && "`link_.shadowTree` must not be null.");
    link_.shadowTree->commit([&](RootShadowNode const &oldRootShadowNode) {
      return oldRootShadowNode.clone(layoutConstraints, layoutContext);
    });
  }
}

LayoutConstraints SurfaceHandler::getLayoutConstraints() const noexcept {
  std::shared_lock<better::shared_mutex> lock(parametersMutex_);
  return parameters_.layoutConstraints;
}

LayoutContext SurfaceHandler::getLayoutContext() const noexcept {
  std::shared_lock<better::shared_mutex> lock(parametersMutex_);
  return parameters_.layoutContext;
}

#pragma mark - Private

void SurfaceHandler::applyDisplayMode(DisplayMode displayMode) const noexcept {
  react_native_assert(
      link_.status == Status::Running && "Surface must be running.");
  react_native_assert(
      link_.shadowTree && "`link_.shadowTree` must not be null.");

  switch (displayMode) {
    case DisplayMode::Visible:
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Normal);
      break;
    case DisplayMode::Suspended:
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Suspended);
      break;
    case DisplayMode::Hidden:
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Normal);
      // Getting a current revision.
      auto revision = link_.shadowTree->getCurrentRevision();
      // Committing an empty tree to force mounting to disassemble view
      // hierarchy.
      link_.shadowTree->commitEmptyTree();
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Suspended);
      // Committing the current revision back. It will be mounted only when
      // `DisplayMode` is changed back to `Normal`.
      link_.shadowTree->commit([&](RootShadowNode const &oldRootShadowNode) {
        return std::static_pointer_cast<RootShadowNode>(
            revision.rootShadowNode->ShadowNode::clone(ShadowNodeFragment{}));
      });
      break;
  }
}

void SurfaceHandler::setUIManager(UIManager const *uiManager) const noexcept {
  std::unique_lock<better::shared_mutex> lock(linkMutex_);

  react_native_assert(
      link_.status != Status::Running && "Surface must not be running.");

  if (link_.uiManager == uiManager) {
    return;
  }

  link_.uiManager = uiManager;
  link_.status = uiManager ? Status::Registered : Status::Unregistered;
}

SurfaceHandler::~SurfaceHandler() noexcept {
  react_native_assert(
      link_.status == Status::Unregistered &&
      "`SurfaceHandler` must be unregistered (or moved-from) before deallocation.");
}

} // namespace react
} // namespace facebook
