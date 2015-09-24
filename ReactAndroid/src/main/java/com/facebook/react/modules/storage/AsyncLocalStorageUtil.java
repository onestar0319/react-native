/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.storage;

import javax.annotation.Nullable;

import java.util.Arrays;
import java.util.Iterator;

import android.content.ContentValues;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.text.TextUtils;

import com.facebook.react.bridge.ReadableArray;

import org.json.JSONException;
import org.json.JSONObject;

import static com.facebook.react.modules.storage.ReactDatabaseSupplier.KEY_COLUMN;
import static com.facebook.react.modules.storage.ReactDatabaseSupplier.TABLE_CATALYST;
import static com.facebook.react.modules.storage.ReactDatabaseSupplier.VALUE_COLUMN;

/**
 * Helper for database operations.
 */
/* package */ class AsyncLocalStorageUtil {

  /**
   * Build the String required for an SQL select statement:
   *  WHERE key IN (?, ?, ..., ?)
   * without 'WHERE' and with selectionCount '?'
   */
  /* package */ static String buildKeySelection(int selectionCount) {
    String[] list = new String[selectionCount];
    Arrays.fill(list, "?");
    return KEY_COLUMN + " IN (" + TextUtils.join(", ", list) + ")";
  }

  /**
   * Build the String[] arguments needed for an SQL selection, i.e.:
   *  {a, b, c}
   * to be used in the SQL select statement: WHERE key in (?, ?, ?)
   */
  /* package */ static String[] buildKeySelectionArgs(ReadableArray keys) {
    String[] selectionArgs = new String[keys.size()];
    for (int keyIndex = 0; keyIndex < keys.size(); keyIndex++) {
      selectionArgs[keyIndex] = keys.getString(keyIndex);
    }
    return selectionArgs;
  }

  /**
   * Returns the value of the given key, or null if not found.
   */
  /* package */ static @Nullable String getItemImpl(SQLiteDatabase db, String key) {
    String[] columns = {VALUE_COLUMN};
    String[] selectionArgs = {key};

    Cursor cursor = db.query(
        TABLE_CATALYST,
        columns,
        KEY_COLUMN + "=?",
        selectionArgs,
        null,
        null,
        null);

    try {
      if (!cursor.moveToFirst()) {
        return null;
      } else {
        return cursor.getString(0);
      }
    } finally {
      cursor.close();
    }
  }

  /**
   * Sets the value for the key given, returns true if successful, false otherwise.
   */
  /* package */ static boolean setItemImpl(SQLiteDatabase db, String key, String value) {
    ContentValues contentValues = new ContentValues();
    contentValues.put(KEY_COLUMN, key);
    contentValues.put(VALUE_COLUMN, value);

    long inserted = db.insertWithOnConflict(
        TABLE_CATALYST,
        null,
        contentValues,
        SQLiteDatabase.CONFLICT_REPLACE);

    return (-1 != inserted);
  }

  /**
   * Does the actual merge of the (key, value) pair with the value stored in the database.
   * NB: This assumes that a database lock is already in effect!
   * @return the errorCode of the operation
   */
  /* package */ static boolean mergeImpl(SQLiteDatabase db, String key, String value)
      throws JSONException {
    String oldValue = getItemImpl(db, key);
    String newValue;

    if (oldValue == null) {
      newValue = value;
    } else {
      JSONObject oldJSON = new JSONObject(oldValue);
      JSONObject newJSON = new JSONObject(value);
      deepMergeInto(oldJSON, newJSON);
      newValue = oldJSON.toString();
    }

    return setItemImpl(db, key, newValue);
  }

  /**
   * Merges two {@link JSONObject}s. The newJSON object will be merged with the oldJSON object by
   * either overriding its values, or merging them (if the values of the same key in both objects
   * are of type {@link JSONObject}). oldJSON will contain the result of this merge.
   */
  private static void deepMergeInto(JSONObject oldJSON, JSONObject newJSON)
      throws JSONException {
    Iterator<?> keys = newJSON.keys();
    while (keys.hasNext()) {
      String key = (String) keys.next();

      JSONObject newJSONObject = newJSON.optJSONObject(key);
      JSONObject oldJSONObject = oldJSON.optJSONObject(key);
      if (newJSONObject != null && oldJSONObject != null) {
        deepMergeInto(oldJSONObject, newJSONObject);
        oldJSON.put(key, oldJSONObject);
      } else {
        oldJSON.put(key, newJSON.get(key));
      }
    }
  }
}
