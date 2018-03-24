/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>

#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/ShadowNode.h>
#include <gtest/gtest.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ShadowNodeTest, handleProps) {
  RawProps raw;
  raw["nativeID"] = "abc";

  auto props = std::make_shared<Props>();
  props->apply(raw);

  // Props are not sealed after applying raw props.
  ASSERT_FALSE(props->getSealed());

  ASSERT_STREQ(props->getNativeId().c_str(), "abc");
}

TEST(ShadowNodeTest, handleShadowNodeCreation) {
  auto node = std::make_shared<TestShadowNode>(9, 1, (void *)NULL);

  ASSERT_FALSE(node->getSealed());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_EQ(node->getInstanceHandle(), (void *)NULL);
  TestShadowNode *nodePtr = node.get();
  ASSERT_EQ(node->getComponentHandle(), typeid(*nodePtr).hash_code());
  ASSERT_EQ(node->getSourceNode(), nullptr);
  ASSERT_EQ(node->getChildren()->size(), 0);

  // TODO(#27369757): getProps() doesn't work
  // ASSERT_STREQ(node->getProps()->getNativeId().c_str(), "testNativeID");

  node->sealRecursive();
  ASSERT_TRUE(node->getSealed());

  // TODO(#27369757): verify Props are also sealed.
  // ASSERT_TRUE(node->getProps()->getSealed());
}

TEST(ShadowNodeTest, handleShadowNodeSimpleCloning) {
  auto node = std::make_shared<TestShadowNode>(9, 1, (void *)NULL);
  auto node2 = std::make_shared<TestShadowNode>(node);

  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);
  ASSERT_EQ(node->getInstanceHandle(), (void *)NULL);
  ASSERT_EQ(node2->getSourceNode(), node);
}

TEST(ShadowNodeTest, handleShadowNodeMutation) {
  auto node1 = std::make_shared<TestShadowNode>(1, 1, (void *)NULL);
  auto node2 = std::make_shared<TestShadowNode>(2, 1, (void *)NULL);
  auto node3 = std::make_shared<TestShadowNode>(3, 1, (void *)NULL);

  node1->appendChild(node2);
  node1->appendChild(node3);
  SharedShadowNodeSharedList node1Children = node1->getChildren();
  ASSERT_EQ(node1Children->size(), 2);
  ASSERT_EQ(node1Children->at(0), node2);
  ASSERT_EQ(node1Children->at(1), node3);

  auto node4 = std::make_shared<TestShadowNode>(node2);
  node1->replaceChild(node2, node4);
  node1Children = node1->getChildren();
  ASSERT_EQ(node1Children->size(), 2);
  ASSERT_EQ(node1Children->at(0), node4);
  ASSERT_EQ(node1Children->at(1), node3);

  // Seal the entire tree.
  node1->sealRecursive();
  ASSERT_TRUE(node1->getSealed());
  ASSERT_TRUE(node3->getSealed());
  ASSERT_TRUE(node4->getSealed());

  // No more mutation after sealing.
  EXPECT_THROW(node4->clearSourceNode(), std::runtime_error);

  auto node5 = std::make_shared<TestShadowNode>(node4);
  node5->clearSourceNode();
  ASSERT_EQ(node5->getSourceNode(), nullptr);
}
