/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow strict
 * @format
 */

import * as StaticViewConfigValidator from '../StaticViewConfigValidator';

test('passes for identical configs', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    bubblingEventTypes: {
      topBlur: {
        phasedRegistrationNames: {
          bubbled: 'onBlur',
          captured: 'onBlurCapture',
        },
      },
      topFocus: {
        phasedRegistrationNames: {
          bubbled: 'onFocus',
          captured: 'onFocusCapture',
        },
      },
    },
    directEventTypes: {
      topLayout: {
        registrationName: 'onLayout',
      },
    },
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };
  const staticViewConfig = {
    bubblingEventTypes: {
      topBlur: {
        phasedRegistrationNames: {
          bubbled: 'onBlur',
          captured: 'onBlurCapture',
        },
      },
      topFocus: {
        phasedRegistrationNames: {
          bubbled: 'onFocus',
          captured: 'onFocusCapture',
        },
      },
    },
    directEventTypes: {
      topLayout: {
        registrationName: 'onLayout',
      },
    },
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };

  expect(
    StaticViewConfigValidator.validate(
      name,
      nativeViewConfig,
      staticViewConfig,
    ),
  ).toBe(null);
});

test('fails for mismatched names', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      style: {},
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTImage',
    validAttributes: {
      style: {},
    },
  };

  expect(
    StaticViewConfigValidator.validate(
      name,
      nativeViewConfig,
      staticViewConfig,
    ),
  ).toBe(
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'uiViewClassName' is the wrong value.
`.trimStart(),
  );
});

test('fails for unequal attributes', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      nativeID: true,
      style: {},
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      nativeID: {},
      style: {},
    },
  };

  expect(
    StaticViewConfigValidator.validate(
      name,
      nativeViewConfig,
      staticViewConfig,
    ),
  ).toBe(
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'validAttributes.nativeID' is the wrong value.
`.trimStart(),
  );
});

test('fails for missing attributes', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      style: {},
    },
  };

  expect(
    StaticViewConfigValidator.validate(
      name,
      nativeViewConfig,
      staticViewConfig,
    ),
  ).toBe(
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'validAttributes.collapsable' is missing.
- 'validAttributes.nativeID' is missing.
- 'validAttributes.style.height' is missing.
- 'validAttributes.style.width' is missing.
`.trimStart(),
  );
});

test('fails for unexpected attributes', () => {
  const name = 'RCTView';
  const nativeViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      style: {},
    },
  };
  const staticViewConfig = {
    uiViewClassName: 'RCTView',
    validAttributes: {
      collapsable: true,
      nativeID: true,
      style: {
        height: true,
        width: true,
      },
    },
  };

  expect(
    StaticViewConfigValidator.validate(
      name,
      nativeViewConfig,
      staticViewConfig,
    ),
  ).toBe(
    `
StaticViewConfigValidator: Invalid static view config for 'RCTView'.

- 'validAttributes.style.height' is present but not expected to be.
- 'validAttributes.style.width' is present but not expected to be.
- 'validAttributes.collapsable' is present but not expected to be.
- 'validAttributes.nativeID' is present but not expected to be.
`.trimStart(),
  );
});
