/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayoutManager.h"

#import "RCTTextLayoutManager.h"

namespace facebook {
namespace react {

TextLayoutManager::TextLayoutManager(ContextContainer::Shared const &contextContainer)
{
  self_ = (__bridge_retained void *)[RCTTextLayoutManager new];
}

TextLayoutManager::~TextLayoutManager()
{
  CFRelease(self_);
  self_ = nullptr;
}

void *TextLayoutManager::getNativeTextLayoutManager() const
{
  assert(self_ && "Stored NativeTextLayoutManager must not be null.");
  return self_;
}

Size TextLayoutManager::measure(
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    LayoutConstraints layoutConstraints) const
{
  return measureCache_.get(
      MeasureCacheKey{attributedString, paragraphAttributes, layoutConstraints}, [&](MeasureCacheKey const &key) {
        RCTTextLayoutManager *textLayoutManager = (__bridge RCTTextLayoutManager *)self_;
        return [textLayoutManager measureWithAttributedString:attributedString
                                          paragraphAttributes:paragraphAttributes
                                            layoutConstraints:layoutConstraints];
      });
}

} // namespace react
} // namespace facebook
