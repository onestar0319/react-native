/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSampleTurboCxxModule.h"

#import <cxxreact/CxxModule.h>
#import <jsireact/SampleTurboCxxModule.h>
#import "SampleTurboCxxModuleLegacyImpl.h"

using namespace facebook;

// ObjC++ wrapper.
@implementation RCTSampleTurboCxxModule_v1

RCT_EXPORT_MODULE();

- (std::shared_ptr<react::TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<react::JSCallInvoker>)jsInvoker
{
  return std::make_shared<react::SampleTurboCxxModule>(jsInvoker);
}

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return nullptr;
}

@end

@implementation RCTSampleTurboCxxModule_v2

RCT_EXPORT_MODULE();

- (std::unique_ptr<xplat::module::CxxModule>)createModule
{
  return std::make_unique<react::SampleTurboCxxModuleLegacyImpl>();
}

@end
