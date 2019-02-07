/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const {generateStructName} = require('./EventEmitterHelpers.js');

import type {
  ComponentShape,
  EventTypeShape,
  ObjectPropertyType,
  SchemaType,
} from '../CodegenSchema';

// File path -> contents
type FilesOutput = Map<string, string>;

type ComponentCollection = $ReadOnly<{
  [component: string]: ComponentShape,
}>;

type SettersSet = Set<string>;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/components/::_LIBRARY_::/EventEmitters.h>

namespace facebook {
namespace react {

::_EVENTS_::

} // namespace react
} // namespace facebook
`;

const componentTemplate = `
void ::_CLASSNAME_::EventEmitter::::_EVENT_NAME_::(::_STRUCT_NAME_:: event) const {
  dispatchEvent("::_DISPATCH_EVENT_NAME_::", [event=std::move(event)](jsi::Runtime &runtime) {
    ::_IMPLEMENTATION_::
  });
}
`.trim();

function generateSetter(variableName, propertyName, propertyParts) {
  const trailingPeriod = propertyParts.length === 0 ? '' : '.';
  const eventChain = `event.${propertyParts.join(
    '.',
  )}${trailingPeriod}${propertyName});`;

  return `${variableName}.setProperty(runtime, "${propertyName}", ${eventChain}`;
}

function generateSetters(
  parentPropertyName: string,
  properties: $ReadOnlyArray<ObjectPropertyType>,
  propertyParts: $ReadOnlyArray<string>,
): string {
  const propSetters = properties
    .map(eventProperty => {
      switch (eventProperty.type) {
        case 'BooleanTypeAnnotation':
        case 'StringTypeAnnotation':
        case 'Int32TypeAnnotation':
        case 'FloatTypeAnnotation':
          return generateSetter(
            parentPropertyName,
            eventProperty.name,
            propertyParts,
          );
        case 'ObjectTypeAnnotation':
          const propertyName = eventProperty.name;
          return `
            {
              auto ${propertyName} = jsi::Object(runtime);
              ${generateSetters(
                propertyName,
                eventProperty.properties,
                propertyParts.concat([propertyName]),
              )}

              ${parentPropertyName}.setProperty(runtime, "${propertyName}", ${propertyName});
            }
          `.trim();
        default:
          (eventProperty: empty);
          throw new Error('Receieved invalid event property type');
      }
    })
    .join('\n');

  return propSetters;
}

function generateEvent(componentName: string, event): string {
  const implementation = `
    auto payload = jsi::Object(runtime);
    ${generateSetters('payload', event.typeAnnotation.argument.properties, [])}
    return payload;
  `.trim();

  if (!event.name.startsWith('on')) {
    throw new Error('Expected the event name to start with `on`');
  }

  // This is a gross hack necessary because native code is sending
  // events named things like topChange to JS which is then converted back to
  // call the onChange prop. We should be consistent throughout the system.
  // In order to migrate to this new system we have to support the current
  // naming scheme. We should delete this once we are able to control this name
  // throughout the system.
  const dispatchEventName = `${event.name[2].toLowerCase()}${event.name.slice(
    3,
  )}`;

  return componentTemplate
    .replace(/::_CLASSNAME_::/g, componentName)
    .replace(/::_EVENT_NAME_::/g, event.name)
    .replace(/::_DISPATCH_EVENT_NAME_::/g, dispatchEventName)
    .replace(
      '::_STRUCT_NAME_::',
      generateStructName(componentName, [event.name]),
    )
    .replace('::_IMPLEMENTATION_::', implementation);
}

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
    const moduleComponents: ComponentCollection = Object.keys(schema.modules)
      .map(moduleName => {
        const components = schema.modules[moduleName].components;
        // No components in this module
        if (components == null) {
          return null;
        }

        return components;
      })
      .filter(Boolean)
      .reduce((acc, components) => Object.assign(acc, components), {});

    const fileName = 'EventEmitters.cpp';

    const componentEmitters = Object.keys(moduleComponents)
      .map(componentName => {
        const component = moduleComponents[componentName];

        return component.events
          .map(event => {
            return generateEvent(componentName, event);
          })
          .join('\n');
      })
      .join('\n');

    const replacedTemplate = template
      .replace(/::_COMPONENT_EMITTERS_::/g, componentEmitters)
      .replace('::_LIBRARY_::', libraryName)
      .replace('::_EVENTS_::', componentEmitters);

    return new Map([[fileName, replacedTemplate]]);
  },
};
