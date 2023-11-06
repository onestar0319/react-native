/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Command } from '../src/Command';
import { Event } from '../src/Event';
import {
  emitNotificationDecl,
  emitRequestDecl,
  emitResponseDecl,
  emitTypeDecl,
} from '../src/HeaderWriter';
import {FakeWritable, expectCodeIsEqual} from '../src/TestHelpers';
import { Type } from '../src/Type';

let stream = null;

beforeEach(() => {
  stream = new FakeWritable();
});

test('emits type decl', () => {
  let obj = {
    'id': 'Location',
    'type': 'object',
    'properties': [
        { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Script identifier as reported in the <code>Debugger.scriptParsed</code>.' },
        { 'name': 'lineNumber', 'type': 'integer', 'description': 'Line number in the script (0-based).' },
        { 'name': 'columnNumber', 'type': 'integer', 'optional': true, 'description': 'Column number in the script (0-based).' },
    ],
    'description': 'Location in the source code.',
  };
  let type = Type.create('Debugger', obj);

  emitTypeDecl(stream, type);

  expectCodeIsEqual(stream.get(), `
    struct debugger::Location : public Serializable {
      Location() = default;
      Location(Location&&) = default;
      Location(const Location&) = delete;
      explicit Location(const folly::dynamic &obj);
      folly::dynamic toDynamic() const override;
      Location& operator=(const Location&) = delete;
      Location& operator=(Location&&) = default;

      runtime::ScriptId scriptId{};
      int lineNumber{};
      std::optional<int> columnNumber;
    };
  `);
});

test('emits request decl', () => {
  let obj = {
    'name': 'getScriptSource',
    'parameters': [
      { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Id of the script to get source for.' },
    ],
    'returns': [
      { 'name': 'scriptSource', 'type': 'string', 'description': 'Script source.' },
    ],
    'description': 'Returns source for the script with given id.',
  };
  let command = Command.create('Debugger', obj);

  emitRequestDecl(stream, command);

  expectCodeIsEqual(stream.get(), `
    struct debugger::GetScriptSourceRequest : public Request {
      GetScriptSourceRequest();
      explicit GetScriptSourceRequest(const folly::dynamic &obj);

      folly::dynamic toDynamic() const override;
      void accept(RequestHandler &handler) const override;

      runtime::ScriptId scriptId{};
    };
  `);
});

test('emits response decl', () => {
  let obj = {
    'name': 'getScriptSource',
    'parameters': [
      { 'name': 'scriptId', '$ref': 'Runtime.ScriptId', 'description': 'Id of the script to get source for.' },
    ],
    'returns': [
      { 'name': 'scriptSource', 'type': 'string', 'description': 'Script source.' },
    ],
    'description': 'Returns source for the script with given id.',
  };
  let command = Command.create('Debugger', obj);

  emitResponseDecl(stream, command);

  expectCodeIsEqual(stream.get(), `
    struct debugger::GetScriptSourceResponse : public Response {
      GetScriptSourceResponse() = default;
      explicit GetScriptSourceResponse(const folly::dynamic &obj);
      folly::dynamic toDynamic() const override;

      std::string scriptSource;
    };
  `);
});

test('emits notification decl', () => {
  let obj = {
    'name': 'messageAdded',
    'parameters': [
      { 'name': 'message', '$ref': 'ConsoleMessage', 'description': 'Console message that has been added.' },
    ],
    'description': 'Issued when new console message is added.',
  };
  let event = Event.create('Console', obj);

  emitNotificationDecl(stream, event);

  expectCodeIsEqual(stream.get(), `
    struct console::MessageAddedNotification : public Notification {
      MessageAddedNotification();
      explicit MessageAddedNotification(const folly::dynamic &obj);
      folly::dynamic toDynamic() const override;

      console::ConsoleMessage message{};
    };
  `);
});
