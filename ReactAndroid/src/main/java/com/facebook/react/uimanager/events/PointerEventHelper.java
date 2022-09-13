/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events;

import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.R;
import com.facebook.react.common.ReactConstants;

/** Class responsible for generating catalyst touch events based on android {@link MotionEvent}. */
public class PointerEventHelper {

  public static final String POINTER_TYPE_TOUCH = "touch";
  public static final String POINTER_TYPE_PEN = "pen";
  public static final String POINTER_TYPE_MOUSE = "mouse";
  public static final String POINTER_TYPE_UNKNOWN = "";

  public static enum EVENT {
    CANCEL,
    CANCEL_CAPTURE,
    DOWN,
    DOWN_CAPTURE,
    ENTER,
    ENTER_CAPTURE,
    LEAVE,
    LEAVE_CAPTURE,
    MOVE,
    MOVE_CAPTURE,
    UP,
    UP_CAPTURE,
    OUT,
    OUT_CAPTURE,
    OVER,
    OVER_CAPTURE,
  };

  public static final String POINTER_CANCEL = "topPointerCancel";
  public static final String POINTER_DOWN = "topPointerDown";
  public static final String POINTER_ENTER = "topPointerEnter";
  public static final String POINTER_LEAVE = "topPointerLeave";
  public static final String POINTER_MOVE = "topPointerMove";
  public static final String POINTER_UP = "topPointerUp";
  public static final String POINTER_OVER = "topPointerOver";
  public static final String POINTER_OUT = "topPointerOut";

  /** We don't dispatch capture events from native; that's currently handled by JS. */
  public static @Nullable String getDispatchableEventName(EVENT event) {
    switch (event) {
      case LEAVE:
        return PointerEventHelper.POINTER_LEAVE;
      case DOWN:
        return PointerEventHelper.POINTER_DOWN;
      case MOVE:
        return PointerEventHelper.POINTER_MOVE;
      case ENTER:
        return PointerEventHelper.POINTER_ENTER;
      case CANCEL:
        return PointerEventHelper.POINTER_CANCEL;
      case UP:
        return PointerEventHelper.POINTER_UP;
      case OVER:
        return PointerEventHelper.POINTER_OVER;
      case OUT:
        return PointerEventHelper.POINTER_OUT;
      default:
        FLog.e(ReactConstants.TAG, "No dispatchable event name for type: " + event);
        return null;
    }
  }

  // https://w3c.github.io/pointerevents/#the-button-property
  public static int getButtonChange(int lastButtonState, int currentButtonState) {
    int changedMask = currentButtonState ^ lastButtonState;
    if (changedMask == 0) {
      return -1;
    }

    switch (changedMask) {
      case MotionEvent.BUTTON_PRIMARY: // left button, touch/pen contact
        return 0;
      case MotionEvent.BUTTON_TERTIARY: // middle mouse
        return 1;
      case MotionEvent.BUTTON_SECONDARY: // rightbutton, Pen barrel button
        return 2;
      case MotionEvent.BUTTON_BACK:
        return 3;
      case MotionEvent.BUTTON_FORWARD:
        return 4;
        // TOD0 - Pen eraser button maps to what?
    }
    return -1;
  }

  public static boolean isPrimary(int pointerId, int primaryPointerId, MotionEvent event) {
    if (supportsHover(event)) {
      return true;
    }

    return pointerId == primaryPointerId;
  }

  public static String getW3CPointerType(final int toolType) {
    // https://www.w3.org/TR/pointerevents3/#dom-pointerevent-pointertype
    switch (toolType) {
      case MotionEvent.TOOL_TYPE_FINGER:
        return POINTER_TYPE_TOUCH;

      case MotionEvent.TOOL_TYPE_STYLUS:
        return POINTER_TYPE_PEN;

      case MotionEvent.TOOL_TYPE_MOUSE:
        return POINTER_TYPE_MOUSE;
    }
    return POINTER_TYPE_UNKNOWN;
  }

  public static boolean isListening(@Nullable View view, EVENT event) {
    if (view == null) {
      return false;
    }

    Object value = null;
    switch (event) {
      case DOWN:
      case DOWN_CAPTURE:
      case UP:
      case UP_CAPTURE:
      case CANCEL:
      case CANCEL_CAPTURE:
        return true;
      case ENTER:
        value = view.getTag(R.id.pointer_enter);
        break;
      case ENTER_CAPTURE:
        value = view.getTag(R.id.pointer_enter_capture);
        break;
      case LEAVE:
        value = view.getTag(R.id.pointer_leave);
        break;
      case LEAVE_CAPTURE:
        value = view.getTag(R.id.pointer_leave_capture);
        break;
      case MOVE:
        value = view.getTag(R.id.pointer_move);
        break;
      case MOVE_CAPTURE:
        value = view.getTag(R.id.pointer_move_capture);
        break;
      case OVER:
        value = view.getTag(R.id.pointer_over);
        break;
      case OVER_CAPTURE:
        value = view.getTag(R.id.pointer_over_capture);
        break;
      case OUT:
        value = view.getTag(R.id.pointer_out);
        break;
      case OUT_CAPTURE:
        value = view.getTag(R.id.pointer_out_capture);
        break;
    }

    if (value == null) {
      return false;
    }

    if (value instanceof Boolean) {
      return (Boolean) value;
    }
    return false;
  }

  public static int getEventCategory(String pointerEventType) {
    if (pointerEventType == null) {
      return EventCategoryDef.UNSPECIFIED;
    }
    // Following:
    // https://github.com/facebook/react/blob/main/packages/react-dom/src/events/ReactDOMEventListener.js#L435-L437
    switch (pointerEventType) {
      case POINTER_DOWN:
      case POINTER_CANCEL:
      case POINTER_UP:
        return EventCategoryDef.DISCRETE;
      case POINTER_MOVE:
      case POINTER_ENTER:
      case POINTER_LEAVE:
      case POINTER_OVER:
      case POINTER_OUT:
        return EventCategoryDef.CONTINUOUS;
    }

    return EventCategoryDef.UNSPECIFIED;
  }

  public static boolean supportsHover(MotionEvent motionEvent) {
    int source = motionEvent.getSource();
    return source == InputDevice.SOURCE_MOUSE || source == InputDevice.SOURCE_CLASS_POINTER;
  }
}
