/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_PARAM = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  getString: (arg: NotString) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  getString: (arg: string) => Array;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  getString: (arg : Array) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_RETURN = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  getString: (arg: NotString) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_NOT_ONLY_METHODS = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getBool: (arg: boolean) => boolean;
  +getNumber: (arg: number) => number;
  +getString: (arg: string) => string;
  sampleBool: boolean,

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_PROMISE_WITHOUT_TYPE = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getBool: (arg: boolean) => Promise;

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const INCORRECT_NATIVE_MODULES = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface SpecWithoutTypo extends TurboModule {
  // no methods
}

export default TurboModuleRegistry.getEnforcing<SpecWithTypo>('SampleTurboModule');

`;

const NATIVE_MODULE_NULLABLE_BOOLEAN = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getSth(a : ?boolean) => void
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_NULLABLE_NUMBER = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getSth(a : ?number) => void
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';


export default TurboModuleRegistry.getEnforcing<Spec1>('SampleTurboModule1');
export default TurboModuleRegistry.getEnforcing<Spec2>('SampleTurboModule2');

`;

module.exports = {
  NATIVE_MODULES_WITH_PROMISE_WITHOUT_TYPE,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT,
  NATIVE_MODULE_NULLABLE_BOOLEAN,
  NATIVE_MODULE_NULLABLE_NUMBER,
  TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT,
  NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_PARAM,
  NATIVE_MODULES_WITH_NOT_EXISTING_TYPE_AS_RETURN,
  NATIVE_MODULES_WITH_NOT_ONLY_METHODS,
  INCORRECT_NATIVE_MODULES,
};
