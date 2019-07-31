/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export type StackFrame = {|
  column: ?number,
  file: ?string,
  lineNumber: ?number,
  methodName: string,
  collapse?: boolean,
|};

export type ExceptionData = {
  message: string,
  originalMessage: ?string,
  name: ?string,
  componentStack: ?string,
  stack: Array<StackFrame>,
  id: number,
  isFatal: boolean,
  extraData?: ?{},
};

export interface Spec extends TurboModule {
  // Deprecated: Use `reportException`
  +reportFatalException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // Deprecated: Use `reportException`
  +reportSoftException: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  +reportException?: (data: ExceptionData) => void;
  +updateExceptionMessage: (
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) => void;
  // Android only
  +dismissRedbox?: () => void;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>(
  'ExceptionsManager',
);

const ExceptionsManager = {
  reportFatalException(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.reportFatalException(message, stack, exceptionId);
  },
  reportSoftException(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.reportSoftException(message, stack, exceptionId);
  },
  updateExceptionMessage(
    message: string,
    stack: Array<StackFrame>,
    exceptionId: number,
  ) {
    NativeModule.updateExceptionMessage(message, stack, exceptionId);
  },
  dismissRedbox(): void {
    if (NativeModule.dismissRedbox) {
      NativeModule.dismissRedbox();
    }
  },
  reportException(data: ExceptionData): void {
    if (NativeModule.reportException) {
      NativeModule.reportException(data);
      return;
    }
    if (data.isFatal) {
      ExceptionsManager.reportFatalException(data.message, data.stack, data.id);
    } else {
      ExceptionsManager.reportSoftException(data.message, data.stack, data.id);
    }
  },
};

export default ExceptionsManager;
