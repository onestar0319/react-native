/*
 *  Copyright (c) 2013, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

#import "RCTImagePickerManager.h"

#import "RCTConvert.h"
#import "RCTRootView.h"
#import "RCTLog.h"
#import "RCTUtils.h"

#import <UIKit/UIKit.h>

#import <MobileCoreServices/UTCoreTypes.h>

@interface RCTImagePickerManager ()<UIImagePickerControllerDelegate, UINavigationControllerDelegate>

@end

@implementation RCTImagePickerManager
{
  NSMutableArray<UIImagePickerController *> *_pickers;
  NSMutableArray<RCTResponseSenderBlock> *_pickerCallbacks;
  NSMutableArray<RCTResponseSenderBlock> *_pickerCancelCallbacks;
}

RCT_EXPORT_MODULE(ImagePickerIOS);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(canRecordVideos:(RCTResponseSenderBlock)callback)
{
  NSArray<NSString *> *availableMediaTypes = [UIImagePickerController availableMediaTypesForSourceType:UIImagePickerControllerSourceTypeCamera];
  callback(@[@([availableMediaTypes containsObject:(NSString *)kUTTypeMovie])]);
}

RCT_EXPORT_METHOD(canUseCamera:(RCTResponseSenderBlock)callback)
{
  callback(@[@([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])]);
}

RCT_EXPORT_METHOD(openCameraDialog:(NSDictionary *)config
                  successCallback:(RCTResponseSenderBlock)callback
                  cancelCallback:(RCTResponseSenderBlock)cancelCallback)
{
  if (RCTRunningInAppExtension()) {
    cancelCallback(@[@"Camera access is unavailable in an app extension"]);
    return;
  }

  UIImagePickerController *imagePicker = [UIImagePickerController new];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypeCamera;

  if ([RCTConvert BOOL:config[@"videoMode"]]) {
    imagePicker.cameraCaptureMode = UIImagePickerControllerCameraCaptureModeVideo;
  }

  [self _presentPicker:imagePicker
       successCallback:callback
        cancelCallback:cancelCallback];
}

RCT_EXPORT_METHOD(openSelectDialog:(NSDictionary *)config
                  successCallback:(RCTResponseSenderBlock)callback
                  cancelCallback:(RCTResponseSenderBlock)cancelCallback)
{
  if (RCTRunningInAppExtension()) {
    cancelCallback(@[@"Image picker is currently unavailable in an app extension"]);
    return;
  }

  UIImagePickerController *imagePicker = [UIImagePickerController new];
  imagePicker.delegate = self;
  imagePicker.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;

  NSMutableArray<NSString *> *allowedTypes = [NSMutableArray new];
  if ([RCTConvert BOOL:config[@"showImages"]]) {
    [allowedTypes addObject:(NSString *)kUTTypeImage];
  }
  if ([RCTConvert BOOL:config[@"showVideos"]]) {
    [allowedTypes addObject:(NSString *)kUTTypeMovie];
  }

  imagePicker.mediaTypes = allowedTypes;

  [self _presentPicker:imagePicker
       successCallback:callback
        cancelCallback:cancelCallback];
}

- (void)imagePickerController:(UIImagePickerController *)picker
didFinishPickingMediaWithInfo:(NSDictionary<NSString *, id> *)info
{
  [self _dismissPicker:picker args:@[
    [info[UIImagePickerControllerReferenceURL] absoluteString]
  ]];
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
  [self _dismissPicker:picker args:nil];
}

- (void)_presentPicker:(UIImagePickerController *)imagePicker
       successCallback:(RCTResponseSenderBlock)callback
        cancelCallback:(RCTResponseSenderBlock)cancelCallback
{
  if (!_pickers) {
    _pickers = [NSMutableArray new];
    _pickerCallbacks = [NSMutableArray new];
    _pickerCancelCallbacks = [NSMutableArray new];
  }

  [_pickers addObject:imagePicker];
  [_pickerCallbacks addObject:callback];
  [_pickerCancelCallbacks addObject:cancelCallback];

  UIViewController *rootViewController = RCTKeyWindow().rootViewController;
  [rootViewController presentViewController:imagePicker animated:YES completion:nil];
}

- (void)_dismissPicker:(UIImagePickerController *)picker args:(NSArray *)args
{
  NSUInteger index = [_pickers indexOfObject:picker];
  RCTResponseSenderBlock callback = _pickerCancelCallbacks[index];

  [_pickers removeObjectAtIndex:index];
  [_pickerCallbacks removeObjectAtIndex:index];
  [_pickerCancelCallbacks removeObjectAtIndex:index];

  UIViewController *rootViewController = RCTKeyWindow().rootViewController;
  [rootViewController dismissViewControllerAnimated:YES completion:nil];

  callback(args ?: @[]);
}

@end
