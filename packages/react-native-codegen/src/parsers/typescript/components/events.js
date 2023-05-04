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
import type {TypeDeclarationMap} from '../../utils';
import type {Parser} from '../../parser';
const {flattenProperties} = require('./componentsUtils');
const {parseTopLevelType} = require('../parseTopLevelType');
const {
  throwIfEventHasNoName,
  throwIfBubblingTypeIsNull,
} = require('../../error-utils');

function getPropertyType(
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  name,
  optionalProperty: boolean,
  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  annotation,
): NamedShape<EventTypeAnnotation> {
  const topLevelType = parseTopLevelType(annotation);
  const typeAnnotation = topLevelType.type;
  const optional = optionalProperty || topLevelType.optional;
  const type =
    typeAnnotation.type === 'TSTypeReference'
      ? typeAnnotation.typeName.name
      : typeAnnotation.type;

  switch (type) {
    case 'TSBooleanKeyword':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };
    case 'TSStringKeyword':
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
    case 'TSTypeLiteral':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'ObjectTypeAnnotation',
          properties: typeAnnotation.members.map(buildPropertiesForEvent),
        },
      };
    case 'TSUnionType':
      return {
        name,
        optional,
        typeAnnotation: {
          type: 'StringEnumTypeAnnotation',
          options: typeAnnotation.types.map(option => option.literal.value),
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
    case 'TSArrayType':
      return {
        name,
        optional,
        typeAnnotation: extractArrayElementType(typeAnnotation, name),
      };
    default:
      (type: empty);
      throw new Error(`Unable to determine event type for "${name}": ${type}`);
  }
}

function extractArrayElementType(
  typeAnnotation: $FlowFixMe,
  name: string,
): EventTypeAnnotation {
  const type = extractTypeFromTypeAnnotation(typeAnnotation);

  switch (type) {
    case 'TSParenthesizedType':
      return extractArrayElementType(typeAnnotation.typeAnnotation, name);
    case 'TSBooleanKeyword':
      return {type: 'BooleanTypeAnnotation'};
    case 'TSStringKeyword':
      return {type: 'StringTypeAnnotation'};
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'TSNumberKeyword':
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    case 'TSUnionType':
      return {
        type: 'StringEnumTypeAnnotation',
        options: typeAnnotation.types.map(option => option.literal.value),
      };
    case 'TSTypeLiteral':
      return {
        type: 'ObjectTypeAnnotation',
        properties: typeAnnotation.members.map(buildPropertiesForEvent),
      };
    case 'TSArrayType':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: extractArrayElementType(typeAnnotation.elementType, name),
      };
    default:
      throw new Error(
        `Unrecognized ${type} for Array ${name} in events.\n${JSON.stringify(
          typeAnnotation,
          null,
          2,
        )}`,
      );
  }
}

function extractTypeFromTypeAnnotation(typeAnnotation: $FlowFixMe): string {
  return typeAnnotation.type === 'TSTypeReference'
    ? typeAnnotation.typeName.name
    : typeAnnotation.type;
}

function findEventArgumentsAndType(
  parser: Parser,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  bubblingType: void | 'direct' | 'bubble',
  paperName: ?$FlowFixMe,
): {
  argumentProps: ?$ReadOnlyArray<$FlowFixMe>,
  paperTopLevelNameDeprecated: ?$FlowFixMe,
  bubblingType: ?'direct' | 'bubble',
} {
  if (typeAnnotation.type === 'TSInterfaceDeclaration') {
    return {
      argumentProps: flattenProperties([typeAnnotation], types),
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  }

  if (typeAnnotation.type === 'TSTypeLiteral') {
    return {
      argumentProps: typeAnnotation.members,
      paperTopLevelNameDeprecated: paperName,
      bubblingType,
    };
  }

  throwIfEventHasNoName(typeAnnotation, parser);
  const name = typeAnnotation.typeName.name;
  if (name === 'Readonly') {
    return findEventArgumentsAndType(
      parser,
      typeAnnotation.typeParameters.params[0],
      types,
      bubblingType,
      paperName,
    );
  } else if (name === 'BubblingEventHandler' || name === 'DirectEventHandler') {
    const eventType = name === 'BubblingEventHandler' ? 'bubble' : 'direct';
    const paperTopLevelNameDeprecated =
      typeAnnotation.typeParameters.params.length > 1
        ? typeAnnotation.typeParameters.params[1].literal.value
        : null;

    switch (typeAnnotation.typeParameters.params[0].type) {
      case 'TSNullKeyword':
      case 'TSUndefinedKeyword':
        return {
          argumentProps: [],
          bubblingType: eventType,
          paperTopLevelNameDeprecated,
        };
      default:
        return findEventArgumentsAndType(
          parser,
          typeAnnotation.typeParameters.params[0],
          types,
          eventType,
          paperTopLevelNameDeprecated,
        );
    }
  } else if (types[name]) {
    let elementType = types[name];
    if (elementType.type === 'TSTypeAliasDeclaration') {
      elementType = elementType.typeAnnotation;
    }
    return findEventArgumentsAndType(
      parser,
      elementType,
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
  const optional = property.optional || false;
  let typeAnnotation = property.typeAnnotation.typeAnnotation;

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

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type EventTypeAST = Object;

function buildEventSchema(
  types: TypeDeclarationMap,
  property: EventTypeAST,
  parser: Parser,
): ?EventTypeShape {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(
    property.typeAnnotation.typeAnnotation,
    types,
  );

  const name = property.key.name;
  const typeAnnotation = topLevelType.type;
  const optional = property.optional || topLevelType.optional;
  const {argumentProps, bubblingType, paperTopLevelNameDeprecated} =
    findEventArgumentsAndType(parser, typeAnnotation, types);

  if (!argumentProps) {
    throw new Error(`Unable to determine event arguments for "${name}"`);
  } else if (!bubblingType) {
    throwIfBubblingTypeIsNull(bubblingType, name);
  } else {
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
}

function getEvents(
  eventTypeAST: $ReadOnlyArray<EventTypeAST>,
  types: TypeDeclarationMap,
  parser: Parser,
): $ReadOnlyArray<EventTypeShape> {
  return eventTypeAST
    .map(property => buildEventSchema(types, property, parser))
    .filter(Boolean);
}

module.exports = {
  getEvents,
};
