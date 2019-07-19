package com.facebook.react.uimanager;

import android.view.ViewGroup;
import com.facebook.react.viewmanagers.FloatPropsNativeComponentDelegate;
import com.facebook.react.viewmanagers.FloatPropsNativeComponentInterface;

public class FloatPropsNativeComponentViewManager extends SimpleViewManager<ViewGroup>
    implements FloatPropsNativeComponentInterface<ViewGroup> {

  public static final String REACT_CLASS = "FloatPropsNativeComponentView";

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  private void test() {
    FloatPropsNativeComponentDelegate delegate = new FloatPropsNativeComponentDelegate<ViewGroup>();
  }

  @Override
  public ViewGroup createViewInstance(ThemedReactContext context) {
    throw new IllegalStateException();
  }

  @Override
  public void setBlurRadius(ViewGroup view, Float value) {}

  @Override
  public void setBlurRadius2(ViewGroup view, Float value) {}

  @Override
  public void setBlurRadius3(ViewGroup view, Float value) {}

  @Override
  public void setBlurRadius4(ViewGroup view, Float value) {}

  @Override
  public void setBlurRadius5(ViewGroup view, Float value) {}

  @Override
  public void setBlurRadius6(ViewGroup view, Float value) {}
}
