/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fabric/core/ConcreteComponentDescriptor.h>
#include <fabric/core/ConcreteShadowNode.h>
#include <fabric/core/ShadowNode.h>

using namespace facebook::react;

/**
 * This defines a set of TestComponent classes: Props, ShadowNode, ComponentDescriptor.
 * To be used for testing purpose.
 */

class TestProps : public Props {
public:
  TestProps() {
    RawProps raw;
    raw["nativeID"] = "testNativeID";
    apply(raw);
  }
};
using SharedTestProps = std::shared_ptr<const TestProps>;

class TestShadowNode;
using SharedTestShadowNode = std::shared_ptr<const TestShadowNode>;
class TestShadowNode : public ConcreteShadowNode<TestProps> {
public:
  using ConcreteShadowNode::ConcreteShadowNode;

  ComponentName getComponentName() const override {
    return ComponentName("Test");
  }
};

class TestComponentDescriptor: public ConcreteComponentDescriptor<TestShadowNode> {
public:
  // TODO (shergin): Why does this gets repeated here and the shadow node class?
  ComponentName getComponentName() const override {
    return "Test";
  }
};
