/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once

#ifdef __cplusplus
#define CSS_EXTERN_C_BEGIN extern "C" {
#define CSS_EXTERN_C_END }
#else
#define CSS_EXTERN_C_BEGIN
#define CSS_EXTERN_C_END
#endif

#ifndef FB_ASSERTIONS_ENABLED
#define FB_ASSERTIONS_ENABLED 1
#endif

#if FB_ASSERTIONS_ENABLED
#define CSS_ABORT() abort()
#else
#define CSS_ABORT()
#endif

#define CSS_ASSERT(X, message)        \
  if (!(X)) {                         \
    fprintf(stderr, "%s\n", message); \
    CSS_ABORT();                      \
  }
