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
  throwIfArgumentPropsAreNull,
} = require('../../error-utils');
const {getEventArgument} = require('../../parsers-commons');
const {
  emitBoolProp,
  emitDoubleProp,
  emitFloatProp,
  emitStringProp,
} = require('../../parsers-primitives');

function getPropertyType(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  name,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): NamedShape<EventTypeAnnotation> {
  const type = extractTypeFromTypeAnnotation(typeAnnotation);

  switch (type) {
    case 'BooleanTypeAnnotation':
      return emitBoolProp(name, optional);
    case 'StringTypeAnnotation':
      return emitStringProp(name, optional);
    case 'Int32':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'Int32TypeAnnotation',
        },
      };
    case 'Double':
      return emitDoubleProp(name, optional);
    case 'Float':
      return emitFloatProp(name, optional);
    case '$ReadOnly':
      return getPropertyType(
        name,
        optional,
        typeAnnotation.typeParameters.params[0],
        parser,
      );
    case 'ObjectTypeAnnotation':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: typeAnnotation.properties.map(member =>
            buildPropertiesForEvent(member, parser),
          ),
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
    case 'ArrayTypeAnnotation':
    case '$ReadOnlyArray':
      return {
        name,
        optional,
        typeAnnotation: extractArrayElementType(typeAnnotation, name, parser),
      };
    default:
      throw new Error(`Unable to determine event type for "${name}": ${type}`);
  }
}

function extractArrayElementType(
  typeAnnotation: $FlowFixMe,
  name: string,
  parser: Parser,
): EventTypeAnnotation {
  const type = extractTypeFromTypeAnnotation(typeAnnotation);

  switch (type) {
    case 'BooleanTypeAnnotation':
      return {type: 'BooleanTypeAnnotation'};
    case 'StringTypeAnnotation':
      return {type: 'StringTypeAnnotation'};
    case 'Int32':
      return {type: 'Int32TypeAnnotation'};
    case 'Float':
      return {type: 'FloatTypeAnnotation'};
    case 'NumberTypeAnnotation':
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    case 'UnionTypeAnnotation':
      return {
        type: 'StringEnumTypeAnnotation',
        options: typeAnnotation.types.map(option => option.value),
      };
    case 'UnsafeMixed':
      return {type: 'MixedTypeAnnotation'};
    case 'ObjectTypeAnnotation':
      return {
        type: 'ObjectTypeAnnotation',
        properties: typeAnnotation.properties.map(member =>
          buildPropertiesForEvent(member, parser),
        ),
      };
    case 'ArrayTypeAnnotation':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: extractArrayElementType(
          typeAnnotation.elementType,
          name,
          parser,
        ),
      };
    case '$ReadOnlyArray':
      const genericParams = typeAnnotation.typeParameters.params;
      if (genericParams.length !== 1) {
        throw new Error(
          `Events only supports arrays with 1 Generic type. Found ${
            genericParams.length
          } types:\n${prettify(genericParams)}`,
        );
      }
      return {
        type: 'ArrayTypeAnnotation',
        elementType: extractArrayElementType(genericParams[0], name, parser),
      };
    default:
      throw new Error(
        `Unrecognized ${type} for Array ${name} in events.\n${prettify(
          typeAnnotation,
        )}`,
      );
  }
}

function prettify(jsonObject: $FlowFixMe): string {
  return JSON.stringify(jsonObject, null, 2);
}

function extractTypeFromTypeAnnotation(typeAnnotation: $FlowFixMe): string {
  return typeAnnotation.type === 'GenericTypeAnnotation'
    ? typeAnnotation.id.name
    : typeAnnotation.type;
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
      parser.nullLiteralTypeAnnotation
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

function buildPropertiesForEvent(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  property,
  parser: Parser,
): NamedShape<EventTypeAnnotation> {
  const name = property.key.name;
  const optional = parser.isOptionalProperty(property);
  let typeAnnotation =
    property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;

  return getPropertyType(name, optional, typeAnnotation, parser);
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

  const nonNullableArgumentProps = throwIfArgumentPropsAreNull(
    argumentProps,
    name,
  );
  const nonNullableBubblingType = throwIfBubblingTypeIsNull(bubblingType, name);

  if (paperTopLevelNameDeprecated != null) {
    return {
      name,
      optional,
      bubblingType: nonNullableBubblingType,
      paperTopLevelNameDeprecated,
      typeAnnotation: {
        type: 'EventTypeAnnotation',
        argument: getEventArgument(
          nonNullableArgumentProps,
          buildPropertiesForEvent,
          parser,
        ),
      },
    };
  }

  return {
    name,
    optional,
    bubblingType: nonNullableBubblingType,
    typeAnnotation: {
      type: 'EventTypeAnnotation',
      argument: getEventArgument(
        nonNullableArgumentProps,
        buildPropertiesForEvent,
        parser,
      ),
    },
  };
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
