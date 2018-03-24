/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>

#include "TestComponent.h"

using namespace facebook::react;

TEST(ComponentDescriptorTest, createShadowNode) {
  SharedComponentDescriptor descriptor = std::make_shared<TestComponentDescriptor>();

  ASSERT_EQ(descriptor->getComponentHandle(), typeid(TestShadowNode).hash_code());
  ASSERT_STREQ(descriptor->getComponentName().c_str(), "Test");

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedShadowNode node = descriptor->createShadowNode(9, 1, (void *)NULL, raw);

  ASSERT_EQ(node->getComponentHandle(), typeid(TestShadowNode).hash_code());
  ASSERT_STREQ(node->getComponentName().c_str(), "Test");
  ASSERT_EQ(node->getTag(), 9);
  ASSERT_EQ(node->getRootTag(), 1);

  // TODO(#27369757): getProps() doesn't work
  // ASSERT_STREQ(node->getProps()->getNativeId().c_str(), "testNativeID");
}

TEST(ComponentDescriptorTest, cloneShadowNode) {
  SharedComponentDescriptor descriptor = std::make_shared<TestComponentDescriptor>();

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedShadowNode node = descriptor->createShadowNode(9, 1, (void *)NULL, raw);
  SharedShadowNode cloned = descriptor->cloneShadowNode(node);

  ASSERT_EQ(cloned->getComponentHandle(), typeid(TestShadowNode).hash_code());
  ASSERT_STREQ(cloned->getComponentName().c_str(), "Test");
  ASSERT_EQ(cloned->getTag(), 9);
  ASSERT_EQ(cloned->getRootTag(), 1);

  // TODO(#27369757): getProps() doesn't work
  // ASSERT_STREQ(cloned->getProps()->getNativeId().c_str(), "testNativeID");
}

TEST(ComponentDescriptorTest, appendChild) {
  SharedComponentDescriptor descriptor = std::make_shared<TestComponentDescriptor>();

  RawProps raw;
  raw["nativeID"] = "abc";
  SharedShadowNode node1 = descriptor->createShadowNode(1, 1, (void *)NULL, raw);
  SharedShadowNode node2 = descriptor->createShadowNode(2, 1, (void *)NULL, raw);
  SharedShadowNode node3 = descriptor->createShadowNode(3, 1, (void *)NULL, raw);

  descriptor->appendChild(node1, node2);
  descriptor->appendChild(node1, node3);

  SharedShadowNodeSharedList node1Children = node1->getChildren();
  ASSERT_EQ(node1Children->size(), 2);
  ASSERT_EQ(node1Children->at(0), node2);
  ASSERT_EQ(node1Children->at(1), node3);
}
