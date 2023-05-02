/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  EventTypeShape,
  NamedShape,
  EventTypeAnnotation,
} from '../../../CodegenSchema.js';
import type {Parser} from '../../parser';
const {
  throwIfEventHasNoName,
  throwIfBubblingTypeIsNull,
} = require('../../error-utils');

function getPropertyType(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  name,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
): NamedShape<EventTypeAnnotation> {
  const type =
    typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;

  switch (type) {
    case 'BooleanTypeAnnotation':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };
    case 'StringTypeAnnotation':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'StringTypeAnnotation',
        },
      };
    case 'Int32':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };
    case 'Double':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'DoubleTypeAnnotation',
        },
      };
    case 'Float':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'FloatTypeAnnotation',
        },
      };
    case '$ReadOnly':
      return getPropertyType(
        name,
        optional,
        typeAnnotation.typeParameters.params[0],
      );
    case 'ObjectTypeAnnotation':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: typeAnnotation.properties.map(buildPropertiesForEvent),
        },
      };
    case 'UnionTypeAnnotation':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'StringEnumTypeAnnotation',
          options: typeAnnotation.types.map(option => option.value),
        },
      };
    case 'UnsafeMixed':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'MixedTypeAnnotation',
        },
      };
    default:
      (type: empty);
      throw new Error(`Unable to determine event type for "${name}": ${type}`);
  }
}

function findEventArgumentsAndType(
  parser: Parser,
  typeAnnotation: $FlowFixMe,
  types: TypeMap,
  bubblingType: void | 'direct' | 'bubble',
  paperName: ?$FlowFixMe,
): {
  argumentProps: $FlowFixMe,
  bubblingType: ?('direct' | 'bubble'),
  paperTopLevelNameDeprecated: ?$FlowFixMe,
} {
  throwIfEventHasNoName(typeAnnotation, parser);
  const name = typeAnnotation.id.name;
  if (name === '$ReadOnly') {
    return {
      argumentProps: typeAnnotation.typeParameters.params[0].properties,
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    const eventType = name === 'BubblingEventHandler' ? 'bubble' : 'direct';
    const paperTopLevelNameDeprecated =
      typeAnnotation.typeParameters.params.length > 1
        ? typeAnnotation.typeParameters.params[1].value
        : null;
    if (
      typeAnnotation.typeParameters.params[0].type ===
      'NullLiteralTypeAnnotation'
    ) {
      return {
        argumentProps: [],
        bubblingType: eventType,
        paperTopLevelNameDeprecated,
      };
    }
    return findEventArgumentsAndType(
      parser,
      typeAnnotation.typeParameters.params[0],
      types,
      eventType,
      paperTopLevelNameDeprecated,
    );
  } else if (types[name]) {
    return findEventArgumentsAndType(
      parser,
      types[name].right,
      types,
      bubblingType,
      paperName,
    );
  } else {
    return {
      argumentProps: null,
      bubblingType: null,
      paperTopLevelNameDeprecated: null,
    };
  }
}

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function buildPropertiesForEvent(property): NamedShape<EventTypeAnnotation> {
  const name = property.key.name;
  const optional =
    property.value.type === 'NullableTypeAnnotation' || property.optional;
  let typeAnnotation =
    property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;

  return getPropertyType(name, optional, typeAnnotation);
}

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function getEventArgument(argumentProps, name: $FlowFixMe) {
  return {
    type: 'ObjectTypeAnnotation',
    properties: argumentProps.map(buildPropertiesForEvent),
  };
}

function buildEventSchema(
  types: TypeMap,
  property: EventTypeAST,
  parser: Parser,
): ?EventTypeShape {
  const name = property.key.name;
  const optional =
    property.optional || property.value.type === 'NullableTypeAnnotation';

  let typeAnnotation =
    property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;

  if (
    typeAnnotation.type !== 'GenericTypeAnnotation' ||
    (typeAnnotation.id.name !== 'BubblingEventHandler' &&
      typeAnnotation.id.name !== 'DirectEventHandler')
  ) {
    return null;
  }

  const {argumentProps, bubblingType, paperTopLevelNameDeprecated} =
    findEventArgumentsAndType(parser, typeAnnotation, types);

  if (bubblingType && argumentProps) {
    if (paperTopLevelNameDeprecated != null) {
      return {
        name,
        optional,
        bubblingType,
        paperTopLevelNameDeprecated,
        typeAnnotation: {
          type: 'EventTypeAnnotation',
          argument: getEventArgument(argumentProps, name),
        },
      };
    }

    return {
      name,
      optional,
      bubblingType,
      typeAnnotation: {
        type: 'EventTypeAnnotation',
        argument: getEventArgument(argumentProps, name),
      },
    };
  }

  if (argumentProps === null) {
    throw new Error(`Unable to determine event arguments for "${name}"`);
  }

  throwIfBubblingTypeIsNull(bubblingType, name);
}

// $FlowFixMe[unclear-type] there's no flowtype for ASTs
type EventTypeAST = Object;

type TypeMap = {
  // $FlowFixMe[unclear-type] there's no flowtype for ASTs
  [string]: Object,
  ...
};

function getEvents(
  eventTypeAST: $ReadOnlyArray<EventTypeAST>,
  types: TypeMap,
  parser: Parser,
): $ReadOnlyArray<EventTypeShape> {
  return eventTypeAST
    .filter(property => property.type === 'ObjectTypeProperty')
    .map(property => buildEventSchema(types, property, parser))
    .filter(Boolean);
}

module.exports = {
  getEvents,
};
