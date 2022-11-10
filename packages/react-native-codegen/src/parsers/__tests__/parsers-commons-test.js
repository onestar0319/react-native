/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use-strict';

import {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  wrapNullable,
  unwrapNullable,
  emitUnionTypeAnnotation,
} from '../parsers-commons';
import type {ParserType} from '../errors';
import type {UnionTypeAnnotationMemberType} from '../../CodegenSchema';

const {
  UnsupportedUnionTypeAnnotationParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

import {MockedParser} from '../parserMock';
import {TypeScriptParser} from '../typescript/parser';

const parser = new MockedParser();
const typeScriptParser = new TypeScriptParser();

const flowTranslateTypeAnnotation = require('../flow/modules/index');
const typeScriptTranslateTypeAnnotation = require('../typescript/modules/index');

describe('wrapNullable', () => {
  describe('when nullable is true', () => {
    it('returns nullable type annotation', () => {
      const result = wrapNullable(true, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      };

      expect(result).toEqual(expected);
    });
  });
  describe('when nullable is false', () => {
    it('returns non nullable type annotation', () => {
      const result = wrapNullable(false, {
        type: 'BooleanTypeAnnotation',
      });
      const expected = {
        type: 'BooleanTypeAnnotation',
      };

      expect(result).toEqual(expected);
    });
  });
});

describe('unwrapNullable', () => {
  describe('when type annotation is nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable({
        type: 'NullableTypeAnnotation',
        typeAnnotation: {
          type: 'BooleanTypeAnnotation',
        },
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        true,
      ];

      expect(result).toEqual(expected);
    });
  });
  describe('when type annotation is not nullable', () => {
    it('returns original type annotation', () => {
      const result = unwrapNullable({
        type: 'BooleanTypeAnnotation',
      });
      const expected = [
        {
          type: 'BooleanTypeAnnotation',
        },
        false,
      ];

      expect(result).toEqual(expected);
    });
  });
});

describe('assertGenericTypeAnnotationHasExactlyOneTypeParameter', () => {
  const moduleName = 'testModuleName';

  it("doesn't throw any Error when typeAnnotation has exactly one typeParameter", () => {
    const typeAnnotation = {
      typeParameters: {
        type: 'TypeParameterInstantiation',
        params: [1],
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        parser,
      ),
    ).not.toThrow();
  });

  it('throws a MissingTypeParameterGenericParserError if typeParameters is null', () => {
    const typeAnnotation = {
      typeParameters: null,
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotation,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have type parameters."`,
    );
  });

  it('throws an error if typeAnnotation.typeParameters.type is not equal to parser.typeParameterInstantiation', () => {
    const flowTypeAnnotation = {
      typeParameters: {
        type: 'wrongType',
        params: [1],
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        flowTypeAnnotation,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'"`,
    );
  });

  it("throws a MoreThanOneTypeParameterGenericParserError if typeParameters don't have 1 exactly parameter", () => {
    const typeAnnotationWithTwoParams = {
      typeParameters: {
        params: [1, 2],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithTwoParams,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );

    const typeAnnotationWithNoParams = {
      typeParameters: {
        params: [],
        type: 'TypeParameterInstantiation',
      },
      id: {
        name: 'typeAnnotationName',
      },
    };
    expect(() =>
      assertGenericTypeAnnotationHasExactlyOneTypeParameter(
        moduleName,
        typeAnnotationWithNoParams,
        parser,
      ),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Module testModuleName: Generic 'typeAnnotationName' must have exactly one type parameter."`,
    );
  });
});

describe('isObjectProperty', () => {
  const propertyStub = {
    /* type: 'notObjectTypeProperty', */
    typeAnnotation: {
      typeAnnotation: 'wrongTypeAnnotation',
    },
    value: 'wrongValue',
    name: 'wrongName',
  };

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("returns 'true' if 'property.type' is 'ObjectTypeProperty'", () => {
      const result = isObjectProperty(
        {
          type: 'ObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'true' if 'property.type' is 'ObjectTypeIndexer'", () => {
      const result = isObjectProperty(
        {
          type: 'ObjectTypeIndexer',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'ObjectTypeProperty' or 'ObjectTypeIndexer'", () => {
      const result = isObjectProperty(
        {
          type: 'notObjectTypeProperty',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("returns 'true' if 'property.type' is 'TSPropertySignature'", () => {
      const result = isObjectProperty(
        {
          type: 'TSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'true' if 'property.type' is 'TSIndexSignature'", () => {
      const result = isObjectProperty(
        {
          type: 'TSIndexSignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(true);
    });

    it("returns 'false' if 'property.type' is not 'TSPropertySignature' or 'TSIndexSignature'", () => {
      const result = isObjectProperty(
        {
          type: 'notTSPropertySignature',
          ...propertyStub,
        },
        language,
      );
      expect(result).toEqual(false);
    });
  });
});

describe('parseObjectProperty', () => {
  const moduleName = 'testModuleName';
  const types = {['wrongName']: 'wrongType'};
  const aliasMap = {};
  const tryParse = () => null;
  const cxxOnly = false;
  const nullable = true;

  describe("when 'language' is 'Flow'", () => {
    const language: ParserType = 'Flow';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'ObjectTypeProperty' or 'ObjectTypeIndexer'.", () => {
      const property = {
        type: 'notObjectTypeProperty',
        typeAnnotation: {
          type: 'notObjectTypeProperty',
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          property,
          moduleName,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          nullable,
          flowTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });
  });

  describe("when 'language' is 'TypeScript'", () => {
    const language: ParserType = 'TypeScript';
    it("throws an 'UnsupportedObjectPropertyTypeAnnotationParserError' error if 'property.type' is not 'TSPropertySignature' or 'TSIndexSignature'.", () => {
      const property = {
        type: 'notTSPropertySignature',
        typeAnnotation: {
          typeAnnotation: 'wrongTypeAnnotation',
        },
        value: 'wrongValue',
        name: 'wrongName',
      };
      const expected = new UnsupportedObjectPropertyTypeAnnotationParserError(
        moduleName,
        property,
        property.type,
        language,
      );
      expect(() =>
        parseObjectProperty(
          property,
          moduleName,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          nullable,
          typeScriptTranslateTypeAnnotation,
          parser,
        ),
      ).toThrow(expected);
    });

    it("returns a 'NativeModuleBaseTypeAnnotation' object with 'typeAnnotation.type' equal to 'GenericObjectTypeAnnotation', if 'property.type' is 'TSIndexSignature'.", () => {
      const property = {
        type: 'TSIndexSignature',
        typeAnnotation: {
          type: 'TSIndexSignature',
          typeAnnotation: 'TSIndexSignature',
        },
        key: {
          name: 'testKeyName',
        },
        value: 'wrongValue',
        name: 'wrongName',
        parameters: [{name: 'testName'}],
      };
      const result = parseObjectProperty(
        property,
        moduleName,
        types,
        aliasMap,
        tryParse,
        cxxOnly,
        nullable,
        typeScriptTranslateTypeAnnotation,
        typeScriptParser,
      );
      const expected = {
        name: 'testName',
        optional: false,
        typeAnnotation: wrapNullable(nullable, {
          type: 'GenericObjectTypeAnnotation',
        }),
      };
      expect(result).toEqual(expected);
    });
  });
});

describe('emitUnionTypeAnnotation', () => {
  const hasteModuleName = 'SampleTurboModule';

  describe('when language is flow', () => {
    const language: ParserType = 'Flow';

    describe('when members type is numeric', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'NumberLiteralTypeAnnotation'},
          {type: 'NumberLiteralTypeAnnotation'},
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'NumberTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'NumberTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is string', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'StringLiteralTypeAnnotation'},
          {type: 'StringLiteralTypeAnnotation'},
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'StringTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'StringTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is object', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [{type: 'ObjectTypeAnnotation'}, {type: 'ObjectTypeAnnotation'}],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'ObjectTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'ObjectTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is mixed', () => {
      const typeAnnotation = {
        type: 'UnionTypeAnnotation',
        types: [
          {type: 'NumberLiteralTypeAnnotation'},
          {type: 'StringLiteralTypeAnnotation'},
          {type: 'ObjectTypeAnnotation'},
        ],
      };
      const unionTypes: UnionTypeAnnotationMemberType[] = [
        'NumberTypeAnnotation',
        'StringTypeAnnotation',
        'ObjectTypeAnnotation',
      ];
      describe('when nullable is true', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              true,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });

      describe('when nullable is false', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              false,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });
    });
  });

  describe('when language is typescript', () => {
    const language: ParserType = 'TypeScript';

    describe('when members type is numeric', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral'},
          },
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'NumberTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'NumberTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is string', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral'},
          },
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'StringTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'StringTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is object', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
          },
          {
            type: 'TSLiteralType',
          },
        ],
      };
      describe('when nullable is true', () => {
        it('returns nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            true,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'NullableTypeAnnotation',
            typeAnnotation: {
              type: 'UnionTypeAnnotation',
              memberType: 'ObjectTypeAnnotation',
            },
          };

          expect(result).toEqual(expected);
        });
      });

      describe('when nullable is false', () => {
        it('returns non nullable type annotation', () => {
          const result = emitUnionTypeAnnotation(
            false,
            hasteModuleName,
            typeAnnotation,
            language,
          );

          const expected = {
            type: 'UnionTypeAnnotation',
            memberType: 'ObjectTypeAnnotation',
          };

          expect(result).toEqual(expected);
        });
      });
    });

    describe('when members type is mixed', () => {
      const typeAnnotation = {
        type: 'TSUnionType',
        types: [
          {
            type: 'TSLiteralType',
            literal: {type: 'NumericLiteral'},
          },
          {
            type: 'TSLiteralType',
            literal: {type: 'StringLiteral'},
          },
          {
            type: 'TSLiteralType',
          },
        ],
      };
      const unionTypes = [
        'NumberTypeAnnotation',
        'StringTypeAnnotation',
        'ObjectTypeAnnotation',
      ];
      describe('when nullable is true', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              true,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });

      describe('when nullable is false', () => {
        it('throws an excpetion', () => {
          const expected = new UnsupportedUnionTypeAnnotationParserError(
            hasteModuleName,
            typeAnnotation,
            unionTypes,
            language,
          );

          expect(() => {
            emitUnionTypeAnnotation(
              false,
              hasteModuleName,
              typeAnnotation,
              language,
            );
          }).toThrow(expected);
        });
      });
    });
  });
});
