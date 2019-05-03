// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Differentiator.h"

#include <better/map.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/debug/SystraceSection.h>
#include "ShadowView.h"

namespace facebook {
namespace react {

static void sliceChildShadowNodeViewPairsRecursively(
    ShadowViewNodePairList &pairList,
    Point layoutOffset,
    const ShadowNode &shadowNode) {
  for (const auto &childShadowNode : shadowNode.getChildren()) {
    auto shadowView = ShadowView(*childShadowNode);

    const auto layoutableShadowNode =
        dynamic_cast<const LayoutableShadowNode *>(childShadowNode.get());
#ifndef ANDROID
    // New approach (iOS):
    // Non-view components are treated as layout-only views (they aren't
    // represented as `ShadowView`s).
    if (!layoutableShadowNode || layoutableShadowNode->isLayoutOnly()) {
#else
    // Previous approach (Android):
    // Non-view components are treated as normal views with an empty layout
    // (they are represented as `ShadowView`s).
    if (layoutableShadowNode && layoutableShadowNode->isLayoutOnly()) {
#endif
      sliceChildShadowNodeViewPairsRecursively(
          pairList,
          layoutOffset + shadowView.layoutMetrics.frame.origin,
          *childShadowNode);
    } else {
      shadowView.layoutMetrics.frame.origin += layoutOffset;
      pairList.push_back({shadowView, childShadowNode.get()});
    }
  }
}

static ShadowViewNodePairList sliceChildShadowNodeViewPairs(
    const ShadowNode &shadowNode) {
  auto pairList = ShadowViewNodePairList{};
  sliceChildShadowNodeViewPairsRecursively(pairList, {0, 0}, shadowNode);
  return pairList;
}

static void calculateShadowViewMutations(
    ShadowViewMutationList &mutations,
    const ShadowView &parentShadowView,
    const ShadowViewNodePairList &oldChildPairs,
    const ShadowViewNodePairList &newChildPairs) {
  // The current version of the algorithm is otimized for simplicity,
  // not for performance or optimal result.

  if (oldChildPairs == newChildPairs) {
    return;
  }

  if (oldChildPairs.size() == 0 && newChildPairs.size() == 0) {
    return;
  }

  better::map<Tag, ShadowViewNodePair> insertedPairs;
  int index = 0;

  ShadowViewMutationList createMutations = {};
  ShadowViewMutationList deleteMutations = {};
  ShadowViewMutationList insertMutations = {};
  ShadowViewMutationList removeMutations = {};
  ShadowViewMutationList updateMutations = {};
  ShadowViewMutationList downwardMutations = {};
  ShadowViewMutationList destructiveDownwardMutations = {};

  // Stage 1: Collecting `Update` mutations
  for (index = 0; index < oldChildPairs.size() && index < newChildPairs.size();
       index++) {
    const auto &oldChildPair = oldChildPairs[index];
    const auto &newChildPair = newChildPairs[index];

    if (oldChildPair.shadowView.tag != newChildPair.shadowView.tag) {
      // Totally different nodes, updating is impossible.
      break;
    }

    if (oldChildPair.shadowView != newChildPair.shadowView) {
      updateMutations.push_back(ShadowViewMutation::UpdateMutation(
          parentShadowView,
          oldChildPair.shadowView,
          newChildPair.shadowView,
          index));
    }

    const auto oldGrandChildPairs =
        sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
    const auto newGrandChildPairs =
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
    calculateShadowViewMutations(
        *(newGrandChildPairs.size() ? &downwardMutations
                                    : &destructiveDownwardMutations),
        oldChildPair.shadowView,
        oldGrandChildPairs,
        newGrandChildPairs);
  }

  int lastIndexAfterFirstStage = index;

  // Stage 2: Collecting `Insert` mutations
  for (; index < newChildPairs.size(); index++) {
    const auto &newChildPair = newChildPairs[index];

    insertMutations.push_back(ShadowViewMutation::InsertMutation(
          parentShadowView, newChildPair.shadowView, index));

    insertedPairs.insert({newChildPair.shadowView.tag, newChildPair});
  }

  // Stage 3: Collecting `Delete` and `Remove` mutations
  for (index = lastIndexAfterFirstStage; index < oldChildPairs.size();
       index++) {
    const auto &oldChildPair = oldChildPairs[index];

    // Even if the old view was (re)inserted, we have to generate `remove`
    // mutation.
    removeMutations.push_back(ShadowViewMutation::RemoveMutation(
        parentShadowView, oldChildPair.shadowView, index));

    const auto &it = insertedPairs.find(oldChildPair.shadowView.tag);

    if (it == insertedPairs.end()) {
      // The old view was *not* (re)inserted.
      // We have to generate `delete` mutation and apply the algorithm
      // recursively.
      deleteMutations.push_back(
          ShadowViewMutation::DeleteMutation(oldChildPair.shadowView));

      // We also have to call the algorithm recursively to clean up the entire
      // subtree starting from the removed view.
      calculateShadowViewMutations(
          destructiveDownwardMutations,
          oldChildPair.shadowView,
          sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode),
          {});
    } else {
      // The old view *was* (re)inserted.
      // We have to call the algorithm recursively if the inserted view
      // is *not* the same as removed one.
      const auto &newChildPair = it->second;
      if (newChildPair != oldChildPair) {
        const auto oldGrandChildPairs =
            sliceChildShadowNodeViewPairs(*oldChildPair.shadowNode);
        const auto newGrandChildPairs =
            sliceChildShadowNodeViewPairs(*newChildPair.shadowNode);
        calculateShadowViewMutations(
            *(newGrandChildPairs.size() ? &downwardMutations
                                        : &destructiveDownwardMutations),
            newChildPair.shadowView,
            oldGrandChildPairs,
            newGrandChildPairs);
      }

      // In any case we have to remove the view from `insertedPairs` as
      // indication that the view was actually removed (which means that
      // the view existed before), hence we don't have to generate
      // `create` mutation.
      insertedPairs.erase(it);
    }
  }

  // Stage 4: Collecting `Create` mutations
  for (index = lastIndexAfterFirstStage; index < newChildPairs.size();
       index++) {
    const auto &newChildPair = newChildPairs[index];

    if (insertedPairs.find(newChildPair.shadowView.tag) ==
        insertedPairs.end()) {
      // The new view was (re)inserted, so there is no need to create it.
      continue;
    }

    createMutations.push_back(
        ShadowViewMutation::CreateMutation(newChildPair.shadowView));

    calculateShadowViewMutations(
        downwardMutations,
        newChildPair.shadowView,
        {},
        sliceChildShadowNodeViewPairs(*newChildPair.shadowNode));
  }

  // All mutations in an optimal order:
  std::move(
      destructiveDownwardMutations.begin(),
      destructiveDownwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      updateMutations.begin(),
      updateMutations.end(),
      std::back_inserter(mutations));
  std::move(
      removeMutations.rbegin(),
      removeMutations.rend(),
      std::back_inserter(mutations));
  std::move(
      deleteMutations.begin(),
      deleteMutations.end(),
      std::back_inserter(mutations));
  std::move(
      createMutations.begin(),
      createMutations.end(),
      std::back_inserter(mutations));
  std::move(
      downwardMutations.begin(),
      downwardMutations.end(),
      std::back_inserter(mutations));
  std::move(
      insertMutations.begin(),
      insertMutations.end(),
      std::back_inserter(mutations));
}

ShadowViewMutationList calculateShadowViewMutations(
    const ShadowNode &oldRootShadowNode,
    const ShadowNode &newRootShadowNode) {
  SystraceSection s("calculateShadowViewMutations");

  // Root shadow nodes must be belong the same family.
  assert(ShadowNode::sameFamily(oldRootShadowNode, newRootShadowNode));

  auto mutations = ShadowViewMutationList{};
  mutations.reserve(256);

  auto oldRootShadowView = ShadowView(oldRootShadowNode);
  auto newRootShadowView = ShadowView(newRootShadowNode);

  if (oldRootShadowView != newRootShadowView) {
    mutations.push_back(ShadowViewMutation::UpdateMutation(
        ShadowView(), oldRootShadowView, newRootShadowView, -1));
  }

  calculateShadowViewMutations(
      mutations,
      ShadowView(oldRootShadowNode),
      sliceChildShadowNodeViewPairs(oldRootShadowNode),
      sliceChildShadowNodeViewPairs(newRootShadowNode));

  return mutations;
}

} // namespace react
} // namespace facebook
