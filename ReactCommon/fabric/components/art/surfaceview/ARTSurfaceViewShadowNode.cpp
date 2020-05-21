/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/art/ARTSurfaceViewShadowNode.h>
#include <react/components/art/ARTBaseShadowNode.h>
#include <react/components/art/ARTGroupShadowNode.h>
#include <react/components/art/ARTSurfaceViewState.h>

namespace facebook {
namespace react {

using Content = ARTSurfaceViewShadowNode::Content;

extern const char ARTSurfaceViewComponentName[] = "ARTSurfaceView";

void ARTSurfaceViewShadowNode::layout(LayoutContext layoutContext) {
  ensureUnsealed();
  auto content = getContent();
  updateStateIfNeeded(content);
}

Content const &ARTSurfaceViewShadowNode::getContent() const {
  if (content_.has_value()) {
    return content_.value();
  }
  ensureUnsealed();
  auto elements = Element::ListOfShared{};
  ARTBaseShadowNode::buildElements(*this, elements);
  content_ = Content{elements};
  return content_.value();
}

void ARTSurfaceViewShadowNode::updateStateIfNeeded(Content const &content) {
  ensureUnsealed();

  // TODO T64130144: Compare to make sure it is needed.
  //   auto &state = getStateData();
  //   if (state.attributedString == content.attributedString &&
  //       state.layoutManager == textLayoutManager_) {
  //     return;
  //   }

  setStateData(ARTSurfaceViewState{content.elements});
}

} // namespace react
} // namespace facebook
