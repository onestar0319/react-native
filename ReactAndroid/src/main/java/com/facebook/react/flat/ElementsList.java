/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.lang.reflect.Array;

/**
 * Helper class that supports 3 main operations: start(), add() an element and finish().
 *
 * When started, it takes a baseline array to compare to. When adding a new element, it checks
 * whether a corresponding element in baseline array is the same. On finish(), it will return null
 * if baseline array contains exactly the same elements that were added with a sequence of add()
 * calls, or a new array the recorded elements:
 *
 * Example 1:
 * -----
 * start([A])
 * add(A)
 * finish() -> null (because [A] == [A])
 *
 * Example 2:
 * ----
 * start([A])
 * add(B)
 * finish() -> [B] (because [A] != [B])
 *
 * It is important that start/finish can be nested:
 * ----
 * start([A])
 * add(A)
 *   start([B])
 *   add(B)
 *   finish() -> null
 * add(C)
 * finish() -> [A, C]
 *
 * StateBuilder is using this class to check if e.g. a DrawCommand list for a given View needs to be
 * updated.
 */
/* package */ final class ElementsList<E> {

  private static final class Scope {
    Object[] elements;
    int index;
    int size;
  }

  private final ArrayList<Scope> mScopesStack = new ArrayList<>();
  private final ArrayDeque<E> mElements = new ArrayDeque<>();
  private final E[] mEmptyArray;
  private Scope mCurrentScope = null;
  private int mScopeIndex = 0;

  public ElementsList(E[] emptyArray) {
    mEmptyArray = emptyArray;
    mScopesStack.add(mCurrentScope);
  }

  /**
   * Starts a new scope.
   */
  public void start(Object[] elements) {
    pushScope();

    Scope scope = getCurrentScope();
    scope.elements = elements;
    scope.index = 0;
    scope.size = mElements.size();
  }

  /**
   * Finished current scope, and returns null if there were no changes recorded, or a new array
   * containing all the recorded elements otherwise.
   */
  public E[] finish() {
    Scope scope = getCurrentScope();
    popScope();

    E[] result = null;
    int size = mElements.size() - scope.size;
    if (scope.index != scope.elements.length) {
      result = extractElements(size);
    } else {
      // downsize
      for (int i = 0; i < size; ++i) {
        mElements.pollLast();
      }
    }

    // to prevent leaks
    scope.elements = null;

    return result;
  }

  /**
   * Adds a new element to the list. This method can be optimized to avoid inserts on same elements.
   */
  public void add(E element) {
    Scope scope = getCurrentScope();

    if (scope.index < scope.elements.length &&
        scope.elements[scope.index] == element) {
      ++scope.index;
    } else {
      scope.index = Integer.MAX_VALUE;
    }

    mElements.add(element);
  }

  /**
   * Resets all references to the elements to null to avoid memory leaks.
   */
  public void clear() {
    if (getCurrentScope() != null) {
      throw new RuntimeException("Must call finish() for every start() call being made.");
    }
    mElements.clear();
  }

  /**
   * Extracts last size elements into an array.
   */
  private E[] extractElements(int size) {
    if (size == 0) {
      // avoid allocating empty array
      return mEmptyArray;
    }

    E[] elements = (E[]) Array.newInstance(mEmptyArray.getClass().getComponentType(), size);
    for (int i = size - 1; i >= 0; --i) {
      elements[i] = mElements.pollLast();
    }

    return elements;
  }

  /**
   * Saves current scope in a stack.
   */
  private void pushScope() {
    ++mScopeIndex;
    if (mScopeIndex == mScopesStack.size()) {
      mCurrentScope = new Scope();
      mScopesStack.add(mCurrentScope);
    } else {
      mCurrentScope = mScopesStack.get(mScopeIndex);
    }
  }

  /**
   * Restores last save current scope.
   */
  private void popScope() {
    --mScopeIndex;
    mCurrentScope = mScopesStack.get(mScopeIndex);
  }

  /**
   * Returns current scope.
   */
  private Scope getCurrentScope() {
    return mCurrentScope;
  }
}
