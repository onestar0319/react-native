/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <thread>
#include <utility>

#include <getopt.h>

#include <folly/json.h>
#include <hermes/hermes.h>
#include <hermes/inspector/RuntimeAdapter.h>
#include <hermes/inspector/chrome/Connection.h>

using ::facebook::react::IRemoteConnection;

namespace fbhermes = ::facebook::hermes;

static const char *usageMessage = R"(hermes-chrome-debug-server script.js

Uses Hermes to evaluate script.js within a debugging session. The process will
wait for Chrome DevTools Protocol requests on stdin and writes responses and
events to stdout.

This can be used with a WebSocket bridge to host a Chrome DevTools Protocol
debug server. For instance, running this:

  websocketd --port=9999 hermes-chrome-debug-server script.js

will run a WebSocket server on port 9999 that debugs script.js in Hermes. Chrome
can connect to this debugging session using a URL like this:

  chrome-devtools://devtools/bundled/inspector.html?experiments=false&v8only=true&ws=127.0.0.1:9999

Options:

 -l, --log:  path to a file with pretty-printed protocol logs
 -h, --help: this message
)";

static void usage() {
  fputs(usageMessage, stderr);
  exit(1);
}

static std::string prettify(const std::string &str) {
  try {
    folly::dynamic obj = folly::parseJson(str);
    return folly::toPrettyJson(obj);
  } catch (...) {
    // pass
  }
  return str;
}

static FILE *logFile = stderr;

static void setLogFilePath(const char *path) {
  logFile = fopen(path, "w");

  if (logFile == nullptr) {
    perror("fopen couldn't open log file");
    exit(1);
  }
}

static void log(const std::string &str, bool isReq) {
  fprintf(logFile, "%s %s\n\n", isReq ? "=>" : "<=", prettify(str).c_str());
}

static void logRequest(const std::string &str) {
  log(str, true);
}

static void sendResponse(const std::string &str) {
  log(str, false);
  printf("%s\n", str.c_str());
}

static std::string readScriptSource(const char *path) {
  std::ifstream stream(path);
  return std::string{std::istreambuf_iterator<char>(stream),
                     std::istreambuf_iterator<char>()};
}

static std::string getUrl(const char *path) {
  char absPath[PATH_MAX] = {};
  realpath(path, absPath);
  return std::string("file://") + absPath;
}

static bool handleScriptSourceRequest(
    const std::string &reqStr,
    const std::string &scriptSource) {
  auto req = folly::parseJson(reqStr);

  if (req.at("method") == "Debugger.getScriptSource") {
    folly::dynamic result = folly::dynamic::object;
    result["scriptSource"] = scriptSource;

    folly::dynamic resp = folly::dynamic::object;
    resp["id"] = req.at("id");
    resp["result"] = std::move(result);

    sendResponse(folly::toJson(resp));

    return true;
  }

  return false;
}

class RemoteConnection : public IRemoteConnection {
 public:
  void onMessage(std::string message) override {
    sendResponse(message);
  }

  void onDisconnect() override {}
};

static void runDebuggerLoop(
    fbhermes::inspector::chrome::Connection &conn,
    std::string scriptSource) {
  conn.connect(std::make_unique<RemoteConnection>());

  std::string line;
  while (std::getline(std::cin, line)) {
    logRequest(line);

    if (!handleScriptSourceRequest(line, scriptSource)) {
      conn.sendMessage(line);
    }
  }
}

static void runScript(const std::string &scriptSource, const std::string &url) {
  std::shared_ptr<fbhermes::HermesRuntime> runtime(
      fbhermes::makeHermesRuntime());
  auto adapter =
      std::make_unique<fbhermes::inspector::SharedRuntimeAdapter>(runtime);
  fbhermes::inspector::chrome::Connection conn(
      std::move(adapter), "hermes-chrome-debug-server");
  std::thread debuggerLoop(runDebuggerLoop, std::ref(conn), scriptSource);

  fbhermes::HermesRuntime::DebugFlags flags{};
  runtime->debugJavaScript(scriptSource, url, flags);

  debuggerLoop.join();
}

int main(int argc, char **argv) {
  const char *shortOpts = "l:h";
  const option longOpts[] = {{"log", 1, nullptr, 'l'},
                             {"help", 0, nullptr, 'h'},
                             {nullptr, 0, nullptr, 0}};

  while (true) {
    int opt = getopt_long(argc, argv, shortOpts, longOpts, nullptr);
    if (opt == -1) {
      break;
    }

    switch (opt) {
      case 'l':
        setLogFilePath(optarg);
        break;
      case 'h':
        usage();
        break;
      default:
        fprintf(stderr, "Unrecognized option: %c\n", opt);
        usage();
        break;
    }
  }

  setbuf(logFile, nullptr);
  setbuf(stdout, nullptr);

  if (optind + 1 != argc) {
    usage();
  }

  const char *path = argv[optind];
  std::string scriptSource = readScriptSource(path);
  std::string url = getUrl(path);

  runScript(scriptSource, url);

  fclose(logFile);

  return 0;
}
