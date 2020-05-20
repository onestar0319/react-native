/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ShadowTree.h"

#include <react/components/root/RootComponentDescriptor.h>
#include <react/components/view/ViewShadowNode.h>
#include <react/core/LayoutContext.h>
#include <react/core/LayoutPrimitives.h>
#include <react/debug/SystraceSection.h>
#include <react/mounting/MountingTelemetry.h>
#include <react/mounting/ShadowTreeRevision.h>
#include <react/mounting/ShadowViewMutation.h>

#include "ShadowTreeDelegate.h"
#include "TreeStateReconciliation.h"

namespace facebook {
namespace react {

/*
 * Generates (possibly) a new tree where all nodes with non-obsolete `State`
 * objects. If all `State` objects in the tree are not obsolete for the moment
 * of calling, the function returns `nullptr` (as an indication that no
 * additional work is required).
 */
static ShadowNode::Unshared progressState(ShadowNode const &shadowNode) {
  auto isStateChanged = false;
  auto areChildrenChanged = false;

  auto newState = shadowNode.getState();
  if (newState) {
    newState = newState->getMostRecentStateIfObsolete();
    if (newState) {
      isStateChanged = true;
    }
  }

  auto newChildren = ShadowNode::ListOfShared{};
  if (!shadowNode.getChildren().empty()) {
    auto index = size_t{0};
    for (auto const &childNode : shadowNode.getChildren()) {
      auto newChildNode = progressState(*childNode);
      if (newChildNode) {
        if (!areChildrenChanged) {
          // Making a copy before the first mutation.
          newChildren = shadowNode.getChildren();
        }
        newChildren[index] = newChildNode;
        areChildrenChanged = true;
      }
      index++;
    }
  }

  if (!areChildrenChanged && !isStateChanged) {
    return nullptr;
  }

  return shadowNode.clone({
      ShadowNodeFragment::propsPlaceholder(),
      areChildrenChanged ? std::make_shared<ShadowNode::ListOfShared const>(
                               std::move(newChildren))
                         : ShadowNodeFragment::childrenPlaceholder(),
      isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
}

/*
 * An optimized version of the previous function (and relies on it).
 * The function uses a given base tree to exclude unchanged (equal) parts
 * of the three from the traversing.
 */
static ShadowNode::Unshared progressState(
    ShadowNode const &shadowNode,
    ShadowNode const &baseShadowNode) {
  // The intuition behind the complexity:
  // - A very few nodes have associated state, therefore it's mostly reading and
  //   it only writes when state objects were found obsolete;
  // - Most before-after trees are aligned, therefore most tree branches will be
  //   skipped;
  // - If trees are significantly different, any other algorithm will have
  //   close to linear complexity.

  auto isStateChanged = false;
  auto areChildrenChanged = false;

  auto newState = shadowNode.getState();
  if (newState) {
    newState = newState->getMostRecentStateIfObsolete();
    if (newState) {
      isStateChanged = true;
    }
  }

  auto &children = shadowNode.getChildren();
  auto &baseChildren = baseShadowNode.getChildren();
  auto newChildren = ShadowNode::ListOfShared{};

  auto childrenSize = children.size();
  auto baseChildrenSize = baseChildren.size();
  auto index = size_t{0};

  // Stage 1: Aligned part.
  for (index = 0; index < childrenSize && index < baseChildrenSize; index++) {
    const auto &childNode = *children.at(index);
    const auto &baseChildNode = *baseChildren.at(index);

    if (&childNode == &baseChildNode) {
      // Nodes are identical, skipping.
      continue;
    }

    if (!ShadowNode::sameFamily(childNode, baseChildNode)) {
      // Totally different nodes, updating is impossible.
      break;
    }

    auto newChildNode = progressState(childNode, baseChildNode);
    if (newChildNode) {
      if (!areChildrenChanged) {
        // Making a copy before the first mutation.
        newChildren = children;
      }
      newChildren[index] = newChildNode;
      areChildrenChanged = true;
    }
  }

  // Stage 2: Misaligned part.
  for (; index < childrenSize; index++) {
    auto newChildNode = progressState(*children.at(index));
    if (newChildNode) {
      if (!areChildrenChanged) {
        // Making a copy before the first mutation.
        newChildren = children;
      }
      newChildren[index] = newChildNode;
      areChildrenChanged = true;
    }
  }

  if (!areChildrenChanged && !isStateChanged) {
    return nullptr;
  }

  return shadowNode.clone({
      ShadowNodeFragment::propsPlaceholder(),
      areChildrenChanged ? std::make_shared<ShadowNode::ListOfShared const>(
                               std::move(newChildren))
                         : ShadowNodeFragment::childrenPlaceholder(),
      isStateChanged ? newState : ShadowNodeFragment::statePlaceholder(),
  });
}

static void updateMountedFlag(
    const SharedShadowNodeList &oldChildren,
    const SharedShadowNodeList &newChildren) {
  // This is a simplified version of Diffing algorithm that only updates
  // `mounted` flag on `ShadowNode`s. The algorithm sets "mounted" flag before
  // "unmounted" to allow `ShadowNode` detect a situation where the node was
  // remounted.

  if (&oldChildren == &newChildren) {
    // Lists are identical, nothing to do.
    return;
  }

  if (oldChildren.empty() && newChildren.empty()) {
    // Both lists are empty, nothing to do.
    return;
  }

  int index;

  // Stage 1: Mount and unmount "updated" children.
  for (index = 0; index < oldChildren.size() && index < newChildren.size();
       index++) {
    const auto &oldChild = oldChildren[index];
    const auto &newChild = newChildren[index];

    if (oldChild == newChild) {
      // Nodes are identical, skipping the subtree.
      continue;
    }

    if (!ShadowNode::sameFamily(*oldChild, *newChild)) {
      // Totally different nodes, updating is impossible.
      break;
    }

    newChild->setMounted(true);
    oldChild->setMounted(false);

    updateMountedFlag(oldChild->getChildren(), newChild->getChildren());
  }

  int lastIndexAfterFirstStage = index;

  // State 2: Mount new children.
  for (index = lastIndexAfterFirstStage; index < newChildren.size(); index++) {
    const auto &newChild = newChildren[index];
    newChild->setMounted(true);
    updateMountedFlag({}, newChild->getChildren());
  }

  // State 3: Unmount old children.
  for (index = lastIndexAfterFirstStage; index < oldChildren.size(); index++) {
    const auto &oldChild = oldChildren[index];
    oldChild->setMounted(false);
    updateMountedFlag(oldChild->getChildren(), {});
  }
}

ShadowTree::ShadowTree(
    SurfaceId surfaceId,
    LayoutConstraints const &layoutConstraints,
    LayoutContext const &layoutContext,
    RootComponentDescriptor const &rootComponentDescriptor,
    ShadowTreeDelegate const &delegate,
    MountingOverrideDelegate *mountingOverrideDelegate)
    : surfaceId_(surfaceId), delegate_(delegate) {
  const auto noopEventEmitter = std::make_shared<const ViewEventEmitter>(
      nullptr, -1, std::shared_ptr<const EventDispatcher>());

  const auto props = std::make_shared<const RootProps>(
      *RootShadowNode::defaultSharedProps(), layoutConstraints, layoutContext);

  auto family = rootComponentDescriptor.createFamily(
      ShadowNodeFamilyFragment{surfaceId, surfaceId, noopEventEmitter},
      nullptr);
  rootShadowNode_ = std::static_pointer_cast<const RootShadowNode>(
      rootComponentDescriptor.createShadowNode(
          ShadowNodeFragment{
              /* .props = */ props,
          },
          family));

  mountingCoordinator_ = std::make_shared<MountingCoordinator const>(
      ShadowTreeRevision{rootShadowNode_, 0, {}}, mountingOverrideDelegate);
}

ShadowTree::~ShadowTree() {
  mountingCoordinator_->revoke();
}

Tag ShadowTree::getSurfaceId() const {
  return surfaceId_;
}

MountingCoordinator::Shared ShadowTree::getMountingCoordinator() const {
  return mountingCoordinator_;
}

void ShadowTree::commit(
    ShadowTreeCommitTransaction transaction,
    bool enableStateReconciliation) const {
  SystraceSection s("ShadowTree::commit");

  int attempts = 0;

  while (true) {
    attempts++;
    if (tryCommit(transaction, enableStateReconciliation)) {
      return;
    }

    // After multiple attempts, we failed to commit the transaction.
    // Something internally went terribly wrong.
    assert(attempts < 1024);
  }
}

bool ShadowTree::tryCommit(
    ShadowTreeCommitTransaction transaction,
    bool enableStateReconciliation) const {
  SystraceSection s("ShadowTree::tryCommit");

  auto telemetry = MountingTelemetry{};
  telemetry.willCommit();

  RootShadowNode::Shared oldRootShadowNode;

  {
    // Reading `rootShadowNode_` in shared manner.
    std::shared_lock<better::shared_mutex> lock(commitMutex_);
    oldRootShadowNode = rootShadowNode_;
  }

  RootShadowNode::Unshared newRootShadowNode = transaction(oldRootShadowNode);

  if (!newRootShadowNode) {
    return false;
  }

  if (enableStateReconciliation) {
    if (enableNewStateReconciliation_) {
      auto updatedNewRootShadowNode =
          progressState(*newRootShadowNode, *oldRootShadowNode);
      if (updatedNewRootShadowNode) {
        newRootShadowNode =
            std::static_pointer_cast<RootShadowNode>(updatedNewRootShadowNode);
      }
    } else {
      // Compare state revisions of old and new root
      // Children of the root node may be mutated in-place
      UnsharedShadowNode reconciledNode =
          reconcileStateWithTree(newRootShadowNode.get(), oldRootShadowNode);
      if (reconciledNode != nullptr) {
        newRootShadowNode = std::make_shared<RootShadowNode>(
            *reconciledNode, ShadowNodeFragment{});
      }
    }
  }

  // Layout nodes
  std::vector<LayoutableShadowNode const *> affectedLayoutableNodes{};
  affectedLayoutableNodes.reserve(1024);

  telemetry.willLayout();
  newRootShadowNode->layoutIfNeeded(&affectedLayoutableNodes);
  telemetry.didLayout();

  // Seal the shadow node so it can no longer be mutated
  newRootShadowNode->sealRecursive();

  auto revisionNumber = ShadowTreeRevision::Number{};

  {
    // Updating `rootShadowNode_` in unique manner if it hasn't changed.
    std::unique_lock<better::shared_mutex> lock(commitMutex_);

    if (rootShadowNode_ != oldRootShadowNode) {
      return false;
    }

    rootShadowNode_ = newRootShadowNode;

    {
      std::lock_guard<std::mutex> dispatchLock(EventEmitter::DispatchMutex());

      updateMountedFlag(
          oldRootShadowNode->getChildren(), newRootShadowNode->getChildren());
    }

    revisionNumber_++;
    revisionNumber = revisionNumber_;
  }

  emitLayoutEvents(affectedLayoutableNodes);

  telemetry.didCommit();

  mountingCoordinator_->push(
      ShadowTreeRevision{newRootShadowNode, revisionNumber, telemetry});

  notifyDelegatesOfUpdates();

  return true;
}

void ShadowTree::commitEmptyTree() const {
  commit(
      [](RootShadowNode::Shared const &oldRootShadowNode)
          -> RootShadowNode::Unshared {
        return std::make_shared<RootShadowNode>(
            *oldRootShadowNode,
            ShadowNodeFragment{
                /* .props = */ ShadowNodeFragment::propsPlaceholder(),
                /* .children = */ ShadowNode::emptySharedShadowNodeSharedList(),
            });
      });
}

void ShadowTree::emitLayoutEvents(
    std::vector<LayoutableShadowNode const *> &affectedLayoutableNodes) const {
  SystraceSection s("ShadowTree::emitLayoutEvents");

  for (auto const *layoutableNode : affectedLayoutableNodes) {
    // Only instances of `ViewShadowNode` (and subclasses) are supported.
    auto const &viewShadowNode =
        static_cast<ViewShadowNode const &>(*layoutableNode);
    auto const &viewEventEmitter = static_cast<ViewEventEmitter const &>(
        *viewShadowNode.getEventEmitter());

    // Checking if the `onLayout` event was requested for the particular Shadow
    // Node.
    auto const &viewProps =
        static_cast<ViewProps const &>(*viewShadowNode.getProps());
    if (!viewProps.onLayout) {
      continue;
    }

    viewEventEmitter.onLayout(layoutableNode->getLayoutMetrics());
  }
}

void ShadowTree::notifyDelegatesOfUpdates() const {
  delegate_.shadowTreeDidFinishTransaction(*this, mountingCoordinator_);
}

} // namespace react
} // namespace facebook
