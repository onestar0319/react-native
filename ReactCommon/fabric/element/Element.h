/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/core/ShadowNode.h>

#include <react/element/ElementFragment.h>

namespace facebook {
namespace react {

/*
 * `Element<>` is an abstraction layer that allows describing component
 * hierarchy in a declarative way. Creating `Element`s themself does not create
 * a component tree (aka `ShadowNode` tree) but describes some hierarchical
 * structure that might be used to build an actual component tree (similar to
 * XML Elements).
 * `Element` provides some basic type-safety guarantees: all modifications
 * of element objects require using objects (such as Props or State) of
 * compatible type.
 */
template <typename ShadowNodeT>
class Element final {
 public:
  using ConcreteProps = typename ShadowNodeT::ConcreteProps;
  using SharedConcreteProps = typename ShadowNodeT::SharedConcreteProps;
  using ConcreteEventEmitter = typename ShadowNodeT::ConcreteEventEmitter;
  using ConcreteShadowNode = ShadowNodeT;
  using ConcreteSharedShadowNode = std::shared_ptr<ConcreteShadowNode const>;

  using ConcreteReferenceCallback =
      std::function<void(std::shared_ptr<ShadowNodeT const> const &shadowNode)>;

  /*
   * Constructs an `Element`.
   */
  Element() {
    fragment_.componentHandle = ShadowNodeT::Handle();
    fragment_.componentName = ShadowNodeT::Name();
    fragment_.props = ShadowNodeT::defaultSharedProps();
  }

  /*
   * Sets `tag`.
   */
  Element &tag(Tag tag) {
    fragment_.tag = tag;
    return *this;
  }

  /*
   * Sets `surfaceId`.
   */
  Element &surfaceId(SurfaceId surfaceId) {
    fragment_.surfaceId = surfaceId;
    return *this;
  }

  /*
   * Sets `props`.
   */
  Element &props(SharedConcreteProps props) {
    fragment_.props = props;
    return *this;
  }

  /*
   * Sets `props` using callback.
   */
  Element &props(std::function<SharedConcreteProps()> callback) {
    fragment_.props = callback();
    return *this;
  }

  /*
   * Sets children.
   */
  Element &children(std::vector<Element> children) {
    auto fragments = ElementFragment::List{};
    fragments.reserve(children.size());
    for (auto const &child : children) {
      fragments.push_back(child.fragment_);
    }
    fragment_.children = fragments;
    return *this;
  }

  /*
   * Calls the callback during component construction with a pointer to the
   * component which is being constructed.
   */
  Element &reference(
      std::function<void(ConcreteSharedShadowNode const &shadowNode)>
          callback) {
    fragment_.referenceCallback = callback;
    return *this;
  }

  /*
   * During component construction, assigns a given pointer to a component
   * that is being constructed.
   */
  Element &reference(ConcreteSharedShadowNode &inShadowNode) {
    fragment_.referenceCallback = [&](ShadowNode::Shared const &shadowNode) {
      inShadowNode =
          std::static_pointer_cast<ConcreteShadowNode const>(shadowNode);
    };
    return *this;
  }

  /*
   * Calls the callback with a reference to a just constructed component.
   */
  Element &finalize(
      std::function<void(ConcreteShadowNode &shadowNode)> finalizeCallback) {
    fragment_.finalizeCallback = [=](ShadowNode &shadowNode) {
      return finalizeCallback(static_cast<ConcreteShadowNode &>(shadowNode));
    };
    return *this;
  }

 private:
  friend class ComponentBuilder;
  ElementFragment fragment_;
};

} // namespace react
} // namespace facebook
