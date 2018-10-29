(function () {
  'use strict';

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  var _freeGlobal = freeGlobal;

  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = _freeGlobal || freeSelf || Function('return this')();

  var _root = root;

  /** Built-in value references. */
  var Symbol$1 = _root.Symbol;

  var _Symbol = Symbol$1;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString = objectProto.toString;

  /** Built-in value references. */
  var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the raw `toStringTag`.
   */
  function getRawTag(value) {
    var isOwn = hasOwnProperty.call(value, symToStringTag),
        tag = value[symToStringTag];

    try {
      value[symToStringTag] = undefined;
    } catch (e) {}

    var result = nativeObjectToString.call(value);
    {
      if (isOwn) {
        value[symToStringTag] = tag;
      } else {
        delete value[symToStringTag];
      }
    }
    return result;
  }

  var _getRawTag = getRawTag;

  /** Used for built-in method references. */
  var objectProto$1 = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var nativeObjectToString$1 = objectProto$1.toString;

  /**
   * Converts `value` to a string using `Object.prototype.toString`.
   *
   * @private
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   */
  function objectToString(value) {
    return nativeObjectToString$1.call(value);
  }

  var _objectToString = objectToString;

  /** `Object#toString` result references. */
  var nullTag = '[object Null]',
      undefinedTag = '[object Undefined]';

  /** Built-in value references. */
  var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

  /**
   * The base implementation of `getTag` without fallbacks for buggy environments.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    if (value == null) {
      return value === undefined ? undefinedTag : nullTag;
    }
    return (symToStringTag$1 && symToStringTag$1 in Object(value))
      ? _getRawTag(value)
      : _objectToString(value);
  }

  var _baseGetTag = baseGetTag;

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value;
    return value != null && (type == 'object' || type == 'function');
  }

  var isObject_1 = isObject;

  /** `Object#toString` result references. */
  var asyncTag = '[object AsyncFunction]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    if (!isObject_1(value)) {
      return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = _baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  var isFunction_1 = isFunction;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = _root['__core-js_shared__'];

  var _coreJsData = coreJsData;

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = (function() {
    var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
    return uid ? ('Symbol(src)_1.' + uid) : '';
  }());

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && (maskSrcKey in func);
  }

  var _isMasked = isMasked;

  /** Used for built-in method references. */
  var funcProto = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to convert.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return (func + '');
      } catch (e) {}
    }
    return '';
  }

  var _toSource = toSource;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto$1 = Function.prototype,
      objectProto$2 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar, '\\$&')
    .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
  );

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject_1(value) || _isMasked(value)) {
      return false;
    }
    var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
    return pattern.test(_toSource(value));
  }

  var _baseIsNative = baseIsNative;

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  var _getValue = getValue;

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = _getValue(object, key);
    return _baseIsNative(value) ? value : undefined;
  }

  var _getNative = getNative;

  /* Built-in method references that are verified to be native. */
  var nativeCreate = _getNative(Object, 'create');

  var _nativeCreate = nativeCreate;

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = _nativeCreate ? _nativeCreate(null) : {};
    this.size = 0;
  }

  var _hashClear = hashClear;

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  var _hashDelete = hashDelete;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (_nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty$2.call(data, key) ? data[key] : undefined;
  }

  var _hashGet = hashGet;

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$3.call(data, key);
  }

  var _hashHas = hashHas;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = (_nativeCreate && value === undefined) ? HASH_UNDEFINED$1 : value;
    return this;
  }

  var _hashSet = hashSet;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = _hashClear;
  Hash.prototype['delete'] = _hashDelete;
  Hash.prototype.get = _hashGet;
  Hash.prototype.has = _hashHas;
  Hash.prototype.set = _hashSet;

  var _Hash = Hash;

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  var _listCacheClear = listCacheClear;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || (value !== value && other !== other);
  }

  var eq_1 = eq;

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq_1(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  var _assocIndexOf = assocIndexOf;

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var splice = arrayProto.splice;

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  var _listCacheDelete = listCacheDelete;

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  var _listCacheGet = listCacheGet;

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return _assocIndexOf(this.__data__, key) > -1;
  }

  var _listCacheHas = listCacheHas;

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = _assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  var _listCacheSet = listCacheSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = _listCacheClear;
  ListCache.prototype['delete'] = _listCacheDelete;
  ListCache.prototype.get = _listCacheGet;
  ListCache.prototype.has = _listCacheHas;
  ListCache.prototype.set = _listCacheSet;

  var _ListCache = ListCache;

  /* Built-in method references that are verified to be native. */
  var Map$1 = _getNative(_root, 'Map');

  var _Map = Map$1;

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new _Hash,
      'map': new (_Map || _ListCache),
      'string': new _Hash
    };
  }

  var _mapCacheClear = mapCacheClear;

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value;
    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
      ? (value !== '__proto__')
      : (value === null);
  }

  var _isKeyable = isKeyable;

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return _isKeyable(key)
      ? data[typeof key == 'string' ? 'string' : 'hash']
      : data.map;
  }

  var _getMapData = getMapData;

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = _getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  var _mapCacheDelete = mapCacheDelete;

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return _getMapData(this, key).get(key);
  }

  var _mapCacheGet = mapCacheGet;

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return _getMapData(this, key).has(key);
  }

  var _mapCacheHas = mapCacheHas;

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = _getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  var _mapCacheSet = mapCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = _mapCacheClear;
  MapCache.prototype['delete'] = _mapCacheDelete;
  MapCache.prototype.get = _mapCacheGet;
  MapCache.prototype.has = _mapCacheHas;
  MapCache.prototype.set = _mapCacheSet;

  var _MapCache = MapCache;

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED$2 = '__lodash_hash_undefined__';

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED$2);
    return this;
  }

  var _setCacheAdd = setCacheAdd;

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  var _setCacheHas = setCacheHas;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
        length = values == null ? 0 : values.length;

    this.__data__ = new _MapCache;
    while (++index < length) {
      this.add(values[index]);
    }
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = _setCacheAdd;
  SetCache.prototype.has = _setCacheHas;

  var _SetCache = SetCache;

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while ((fromRight ? index-- : ++index < length)) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  var _baseFindIndex = baseFindIndex;

  /**
   * The base implementation of `_.isNaN` without support for number objects.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
   */
  function baseIsNaN(value) {
    return value !== value;
  }

  var _baseIsNaN = baseIsNaN;

  /**
   * A specialized version of `_.indexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictIndexOf(array, value, fromIndex) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  var _strictIndexOf = strictIndexOf;

  /**
   * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
    return value === value
      ? _strictIndexOf(array, value, fromIndex)
      : _baseFindIndex(array, _baseIsNaN, fromIndex);
  }

  var _baseIndexOf = baseIndexOf;

  /**
   * A specialized version of `_.includes` for arrays without support for
   * specifying an index to search from.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludes(array, value) {
    var length = array == null ? 0 : array.length;
    return !!length && _baseIndexOf(array, value, 0) > -1;
  }

  var _arrayIncludes = arrayIncludes;

  /**
   * This function is like `arrayIncludes` except that it accepts a comparator.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludesWith(array, value, comparator) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (comparator(value, array[index])) {
        return true;
      }
    }
    return false;
  }

  var _arrayIncludesWith = arrayIncludesWith;

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  var _cacheHas = cacheHas;

  /* Built-in method references that are verified to be native. */
  var Set = _getNative(_root, 'Set');

  var _Set = Set;

  /**
   * This method returns `undefined`.
   *
   * @static
   * @memberOf _
   * @since 2.3.0
   * @category Util
   * @example
   *
   * _.times(2, _.noop);
   * // => [undefined, undefined]
   */
  function noop() {
    // No operation performed.
  }

  var noop_1 = noop;

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function(value) {
      result[++index] = value;
    });
    return result;
  }

  var _setToArray = setToArray;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /**
   * Creates a set object of `values`.
   *
   * @private
   * @param {Array} values The values to add to the set.
   * @returns {Object} Returns the new set.
   */
  var createSet = !(_Set && (1 / _setToArray(new _Set([,-0]))[1]) == INFINITY) ? noop_1 : function(values) {
    return new _Set(values);
  };

  var _createSet = createSet;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * The base implementation of `_.uniqBy` without support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The iteratee invoked per element.
   * @param {Function} [comparator] The comparator invoked per element.
   * @returns {Array} Returns the new duplicate free array.
   */
  function baseUniq(array, iteratee, comparator) {
    var index = -1,
        includes = _arrayIncludes,
        length = array.length,
        isCommon = true,
        result = [],
        seen = result;

    if (comparator) {
      isCommon = false;
      includes = _arrayIncludesWith;
    }
    else if (length >= LARGE_ARRAY_SIZE) {
      var set = iteratee ? null : _createSet(array);
      if (set) {
        return _setToArray(set);
      }
      isCommon = false;
      includes = _cacheHas;
      seen = new _SetCache;
    }
    else {
      seen = iteratee ? [] : result;
    }
    outer:
    while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value) : value;

      value = (comparator || value !== 0) ? value : 0;
      if (isCommon && computed === computed) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed) {
            continue outer;
          }
        }
        if (iteratee) {
          seen.push(computed);
        }
        result.push(value);
      }
      else if (!includes(seen, computed, comparator)) {
        if (seen !== result) {
          seen.push(computed);
        }
        result.push(value);
      }
    }
    return result;
  }

  var _baseUniq = baseUniq;

  /**
   * Creates a duplicate-free version of an array, using
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons, in which only the first occurrence of each element
   * is kept. The order of result values is determined by the order they occur
   * in the array.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to inspect.
   * @returns {Array} Returns the new duplicate free array.
   * @example
   *
   * _.uniq([2, 1, 2]);
   * // => [2, 1]
   */
  function uniq(array) {
    return (array && array.length) ? _baseUniq(array) : [];
  }

  var uniq_1 = uniq;

  const TIME = "TIME";
  const CURRENT_PRICE = "CURRENT_PRICE";

  var SORT_BY_TYPES = /*#__PURE__*/Object.freeze({
    TIME: TIME,
    CURRENT_PRICE: CURRENT_PRICE
  });

  const PRICE_CHECKING_INTERVAL = 180000;
  const SYNCHING_INTERVAL = 120000;
  const MAX_UNDO_REMOVED_ITEMS = 10;
  const UNDO_REMOVED_ITEMS_TIMEOUT = 120000;
  const DEFAULT_TITLE = "Price Tag";
  const TRACKED_ITEM_TITLE = "Price Tag - This item is being tracked";

  const ITEM_STATUSES = {
    WATCHED: "WATCHED",
    NOT_FOUND: "NOT_FOUND",
    INCREASED: "INCREASED",
    DECREASED: "DECREASED",
    ACK_DECREASE: "ACK_DECREASE",
    ACK_INCREASE: "ACK_INCREASE",
    FIXED: "FIXED"
  };
  const ALL_STATUSES = Object.values(ITEM_STATUSES);
  var ITEM_STATUS = {
    WATCHED: ITEM_STATUSES.WATCHED,
    NOT_FOUND: ITEM_STATUSES.NOT_FOUND,
    INCREASED: ITEM_STATUSES.INCREASED,
    DECREASED: ITEM_STATUSES.DECREASED,
    ACK_DECREASE: ITEM_STATUSES.ACK_DECREASE,
    ACK_INCREASE: ITEM_STATUSES.ACK_INCREASE,
    FIXED: ITEM_STATUSES.FIXED,
    ALL_STATUSES
  };

  const DEFAULT_ICON = "assets/icon_48.png";
  const TRACKED_ITEM_ICON = "assets/icon_active_48.png";
  const PRICE_UPDATE_ICON = "./assets/time-is-money.svg";
  const PRICE_NOT_FOUND_ICON = "./assets/time.svg";
  const PRICE_FIX_ICON = "./assets/coin.svg";

  var MATCHES = {
    PRICE: /((?:\d+[.,])?\d+(?:[.,]\d+)?)/,
    HOSTNAME: /https?:\/\/([\w.]+)\/*/,
    DOMAIN: /^([\w-]+\.)+[\w-]+\w$/,
    URL: /^https?:\/\/([\w-]+\.)+[\w-]+\w(\/[\w-=.]+)+\/?(\?([\w]+=?[\w-%!@()\\["#\]]+&?)*)?/,
    CAPTURE: {
      DOMAIN_IN_URL: /https?:\/\/([\w.]+)\/*/,
      HOSTNAME_AND_PATH: /^https?:\/\/((?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/,
      PROTOCOL_HOSTNAME_AND_PATH: /^(https?:\/\/(?:[\w-]+\.)+[\w-]+\w(?:\/[\w-=.]+)+\/?)/
    }
  };

  function setDefaultAppearance() {
    chrome.browserAction.setTitle({
      title: DEFAULT_TITLE
    });
    chrome.browserAction.setIcon({
      path: DEFAULT_ICON
    });
  }

  function setTrackedItemAppearance() {
    chrome.browserAction.setTitle({
      title: TRACKED_ITEM_TITLE
    });
    chrome.browserAction.setIcon({
      path: TRACKED_ITEM_ICON
    });
  }

  function toPrice(price) {
    const priceNumber = parseFloat(price.replace(",", "."));
    const formattedPrice = priceNumber.toFixed(2);
    return parseFloat(formattedPrice);
  }

  function matchesHostnameAndPath(string) {
    return MATCHES.CAPTURE.HOSTNAME_AND_PATH.test(string);
  }

  function isCanonicalURLRelevant(canonical) {
    return canonical && matchesHostnameAndPath(canonical);
  }

  function matchesDomain(string) {
    return MATCHES.DOMAIN.test(string);
  }

  function matchesHostname(string) {
    return MATCHES.HOSTNAME.test(string);
  }

  function matchesURL(string) {
    return MATCHES.URL.test(string);
  }

  function parseDomainState(result, domain) {
    return result && result[domain] && JSON.parse(result[domain]) || null;
  }

  function captureHostAndPathFromURL(url) {
    const captureHostAndPath = url.match(MATCHES.CAPTURE.HOSTNAME_AND_PATH);
    let hostAndPath = null;

    if (captureHostAndPath) {
      [, hostAndPath] = captureHostAndPath;
    }

    return hostAndPath;
  }

  function captureProtocolHostAndPathFromURL(url) {
    const captureProtocolHostAndPath = url.match(MATCHES.CAPTURE.PROTOCOL_HOSTNAME_AND_PATH);
    let protocolHostAndPath = null;

    if (captureProtocolHostAndPath) {
      [, protocolHostAndPath] = captureProtocolHostAndPath;
    }

    return protocolHostAndPath;
  }

  function filterAllTrackedItems(result) {
    let filteredResult = {};

    for (let domain in result) {
      if (result.hasOwnProperty(domain) && matchesDomain(domain) && result[domain]) {
        const domainItems = JSON.parse(result[domain]);
        filteredResult = _objectSpread({}, filteredResult, {
          [domain]: domainItems
        });
      }
    }

    return filteredResult;
  }

  class StateFactory {
    static createState(sortItemByType) {
      return {
        recordActive: false,
        notifications: {},
        notificationsCounter: 0,
        autoSaveEnabled: false,
        isPriceUpdateEnabled: false,
        selection: null,
        isSimilarElementHighlighted: false,
        originalBackgroundColor: null,
        isCurrentPageTracked: false,
        faviconURL: null,
        _faviconURLMap: {},
        currentURL: null,
        canonicalURL: null,
        browserURL: null,
        domain: null,
        _sortItemsBy: sortItemByType,
        _undoRemovedItems: [],
        _undoRemovedItemsResetTask: null
      };
    }

    static toggleRecord(state) {
      return _objectSpread({}, state, {
        recordActive: !state.recordActive
      });
    }

    static disableRecord(state) {
      return _objectSpread({}, state, {
        recordActive: false
      });
    }

    static updateCurrentDomain(state, domain) {
      return _objectSpread({}, state, {
        domain
      });
    }

    static updateCurrentURL(state, currentURL) {
      return _objectSpread({}, state, {
        currentURL
      });
    }

    static updateCanonicalURL(state, canonicalURL) {
      return _objectSpread({}, state, {
        canonicalURL
      });
    }

    static updateBrowserURL(state, browserURL) {
      return _objectSpread({}, state, {
        browserURL
      });
    }

    static enableCurrentPageTracked(state) {
      return _objectSpread({}, state, {
        isCurrentPageTracked: true
      });
    }

    static disableCurrentPageTracked(state) {
      return _objectSpread({}, state, {
        isCurrentPageTracked: false
      });
    }

    static updateFaviconURL(state, faviconURL) {
      return _objectSpread({}, state, {
        faviconURL
      });
    }

    static updateFaviconURLMapItem(state, tabId, faviconURL) {
      return _objectSpread({}, state, {
        _faviconURLMap: _objectSpread({}, state._faviconURLMap, {
          [tabId]: faviconURL
        })
      });
    }

    static enableAutoSave(state, selection) {
      selection = selection || state.selection;
      return _objectSpread({}, state, {
        autoSaveEnabled: true,
        selection
      });
    }

    static disableAutoSave(state) {
      return _objectSpread({}, state, {
        autoSaveEnabled: false
      });
    }

    static enablePriceUpdate(state, selection) {
      return _objectSpread({}, state, {
        isPriceUpdateEnabled: true,
        selection
      });
    }

    static disablePriceUpdate(state) {
      return _objectSpread({}, state, {
        isPriceUpdateEnabled: false
      });
    }

    static setSelectionInfo(state, selection, price, faviconURL, faviconAlt) {
      return _objectSpread({}, state, {
        selection,
        price,
        faviconURL,
        faviconAlt
      });
    }

    static setSimilarElementHighlight(state, isSimilarElementHighlighted, originalBackgroundColor) {
      return _objectSpread({}, state, {
        isSimilarElementHighlighted,
        originalBackgroundColor
      });
    }

    static incrementNotificationsCounter(state) {
      const notificationsCounter = state.notificationsCounter + 1;
      return _objectSpread({}, state, {
        notificationsCounter
      });
    }

    static deleteNotificationsItem(state, notificationId) {
      const newState = _objectSpread({}, state);

      delete newState.notifications[notificationId];
      return newState;
    }

    static updateNotificationsItem(state, notificationId, notificationState) {
      return _objectSpread({}, state, {
        notifications: _objectSpread({}, state.notifications, {
          [notificationId]: notificationState
        })
      });
    }

    static updateSortItemsBy(state, _sortItemsBy) {
      return _objectSpread({}, state, {
        _sortItemsBy
      });
    }

    static addUndoRemovedItem(state, url, {
      timestamp
    }, maxItems) {
      const itemRef = {
        url,
        timestamp
      };
      const _undoRemovedItemsClone = [...state._undoRemovedItems];

      _undoRemovedItemsClone.unshift(itemRef);

      const _undoRemovedItems = _undoRemovedItemsClone.slice(0, maxItems);

      return _objectSpread({}, state, {
        _undoRemovedItems
      });
    }

    static getUndoRemovedItemsHead(state) {
      return state._undoRemovedItems[0];
    }

    static removeUndoRemovedItem(state) {
      const _undoRemovedItems = [...state._undoRemovedItems];

      _undoRemovedItems.shift();

      return _objectSpread({}, state, {
        _undoRemovedItems
      });
    }

    static resetUndoRemovedItems(state) {
      return _objectSpread({}, state, {
        _undoRemovedItems: []
      });
    }

    static setUndoRemovedItemsResetTask(state, task) {
      return _objectSpread({}, state, {
        _undoRemovedItemsResetTask: task
      });
    }

    static toStorageStateFormat(state) {
      return Object.keys(state).reduce((newState, domain) => {
        return _objectSpread({}, newState, {
          [domain]: JSON.stringify(state[domain])
        });
      }, {});
    }

  }

  function syncStorageState() {
    chrome.storage.local.get(null, localResult => {
      const localState = filterAllTrackedItems(localResult);
      chrome.storage.sync.get(null, syncResult => {
        const syncState = filterAllTrackedItems(syncResult); // TODO: replace this with a lodash cloneDeep !!

        const freshState = JSON.parse(JSON.stringify(localState));

        for (let syncDomain in syncState) {
          if (syncState.hasOwnProperty(syncDomain) && matchesDomain(syncDomain)) {
            const syncStateDomain = syncState[syncDomain];

            if (!freshState[syncDomain]) {
              // TODO: replace this with a lodash cloneDeep !!
              freshState[syncDomain] = JSON.parse(JSON.stringify(syncStateDomain));
            } else {
              for (let syncUrl in syncStateDomain) {
                if (syncStateDomain.hasOwnProperty(syncUrl)) {
                  const syncItem = syncStateDomain[syncUrl];

                  if (!freshState[syncDomain][syncUrl]) {
                    freshState[syncDomain][syncUrl] = Object.assign({}, syncItem);
                  } else if (syncItem.lastUpdateTimestamp > freshState[syncDomain][syncUrl].lastUpdateTimestamp) {
                    // TODO: replace this with a lodash cloneDeep !!
                    freshState[syncDomain][syncUrl] = JSON.parse(JSON.stringify(syncItem));
                  }
                }
              }
            }
          }
        }

        chrome.storage.local.set(StateFactory.toStorageStateFormat(freshState));
        chrome.storage.sync.set(StateFactory.toStorageStateFormat(freshState));
      });
    });
  }

  class Item {
    constructor(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage = null, timestamp, lastUpdateTimestamp) {
      this.selection = selection;
      this.price = price;
      this.currentPrice = price;
      this.startingPrice = price;
      this.previousPrice = !previousPrice ? null : previousPrice;
      this.faviconURL = faviconURL;
      this.faviconAlt = faviconAlt;
      this.timestamp = timestamp || new Date().getTime();
      this.lastUpdateTimestamp = lastUpdateTimestamp || new Date().getTime();
      this.statuses = statuses;
      this.diffPercentage = diffPercentage;
    }

    updateCurrentPrice(newPrice) {
      this.previousPrice = this.currentPrice;
      this.currentPrice = newPrice;
      return this.updateDiffPercentage();
    }

    updateDiffPercentage() {
      const diff = Math.abs(this.currentPrice - this.price) * 100 / this.price;
      const diffPerc = parseFloat(diff.toFixed(2));
      let diffPercentage = null;

      if (diffPerc) {
        diffPercentage = this.currentPrice > this.price ? +diffPerc : -diffPerc;

        if (diffPercentage > 0 && diffPercentage < 1) {
          diffPercentage = Math.ceil(diffPercentage);
        } else if (diffPercentage > -1 && diffPercentage < 0) {
          diffPercentage = Math.floor(diffPercentage);
        }
      }

      this.diffPercentage = diffPercentage;
    }

    updateTrackStatus(newPrice, statusesToAdd, statusesToRemove, forceStartingPrice = false) {
      if (!statusesToAdd) {
        statusesToAdd = [];
      }

      if (!statusesToRemove) {
        statusesToRemove = [];
      }

      this.statuses = uniq_1([...this.removeStatuses(statusesToRemove), ...statusesToAdd]);
      this.lastUpdateTimestamp = new Date().getTime();

      if (forceStartingPrice) {
        this.startingPrice = this.price;
      }

      if (newPrice) {
        this.price = newPrice;
      }
    }

    removeStatuses(statusesToRemove = []) {
      return statusesToRemove.length > 0 && this.statuses.length > 0 ? this.statuses.filter(status => !statusesToRemove.includes(status)) : this.statuses;
    }

    isWatched() {
      return this.statuses.includes(ITEM_STATUS.WATCHED);
    }

    isNotFound() {
      return this.statuses.includes(ITEM_STATUS.NOT_FOUND);
    }

    hasAcknowledgeDecrease() {
      return this.statuses.includes(ITEM_STATUS.ACK_DECREASE);
    }

    hasAcknowledgeIncrease() {
      return this.statuses.includes(ITEM_STATUS.ACK_INCREASE);
    }

  }

  class ItemFactory {
    static createItem(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage) {
      return new Item(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage);
    }

    static createItemFromObject({
      selection,
      price,
      previousPrice,
      faviconURL,
      faviconAlt,
      statuses,
      diffPercentage,
      timestamp,
      lastUpdateTimestamp
    }) {
      return new Item(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage, timestamp, lastUpdateTimestamp);
    }

  }

  function sortItemsByTime({
    timestamp: tsA
  }, {
    timestamp: tsB
  }) {
    return tsA - tsB;
  }

  function sortItemsByCurrentPrice({
    currentPrice: cpA
  }, {
    currentPrice: cpB
  }) {
    return cpA - cpB;
  }

  var sortTrackedItemsBy = {
    TIME: sortItemsByTime,
    CURRENT_PRICE: sortItemsByCurrentPrice
  };

  function createHTMLTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    return template.content;
  }

  function getCanonicalPathFromSource(source) {
    const canonicalElement = source.querySelector("link[rel=\"canonical\"]");
    return canonicalElement && canonicalElement.getAttribute("href");
  }

  function buildSaveConfirmationPayload(currentURL, similarURL) {
    return {
      title: "Item with similar URL to existing one",
      message: "It appears that the item URL you're trying to save:<br>" + `<i><a href="${currentURL}" target="_blank" rel="noopener noreferrer">${currentURL}</a></i><br>` + "is pretty similar to<br>" + `<i><a href="${similarURL}" target="_blank" rel="noopener noreferrer">${similarURL}</a></i><br><br>` + "Since your choice will affect the way items are tracked in this site futurely,<br>please help us helping you by choosing carefully one of the following options:",
      buttons: ["It's not, save it! Remember this option for this site.", "Don't save. Ask me again for items of this site!", "Indeed the same item. Don't save! Remember this option for this site. (Use just URL path for accessing items)", "For now save this item. Ask me again next time!"]
    };
  }

  function buildURLConfirmationPayload(canonicalURL, browserURL, domain) {
    return {
      title: "This website recommends to follow this item through a different URL",
      message: `<u>${domain}</u> says that a more accurate URL for this item would be:<br>` + `<i><a href="${canonicalURL}" target="_blank"  rel="noopener noreferrer">${canonicalURL}</a></i><br>` + "If this is correct, we recommend you to follow it.<br><br>" + "<b>However</b> you can still opt to choose following the current browser URL:<br>" + `<i><a href="${browserURL}" target="_blank" rel="noopener noreferrer">${browserURL}</a></i><br><br>` + "Since your choice will affect the way items are tracked in this site futurely,<br>please help us helping you by choosing carefully one of the following options:",
      buttons: ["Use recommended URL. Remember this option for this site", "Use recommended URL but just this time", "It's not correct, use the current browser URL. Remember this option", "Don't use recommended URL. Use the current browser URL instead but just this time"]
    };
  }

  let State = StateFactory.createState(TIME);

  function removeStatuses(item, statusesToRemove = []) {
    return statusesToRemove.length > 0 && item.statuses.length > 0 ? item.statuses.filter(status => !statusesToRemove.includes(status)) : item.statuses;
  }

  function updateItemDiffPercentage(item) {
    const diff = Math.abs(item.currentPrice - item.price) * 100 / item.price;
    const diffPerc = parseFloat(diff.toFixed(2));
    let diffPercentage = null;

    if (diffPerc) {
      diffPercentage = item.currentPrice > item.price ? +diffPerc : -diffPerc;

      if (diffPercentage > 0 && diffPercentage < 1) {
        diffPercentage = Math.ceil(diffPercentage);
      } else if (diffPercentage > -1 && diffPercentage < 0) {
        diffPercentage = Math.floor(diffPercentage);
      }
    }

    item.diffPercentage = diffPercentage;
    return item;
  }

  function updateItemTrackStatus(item, newPrice, statusesToAdd, statusesToRemove, forceStartingPrice = false) {
    if (!statusesToAdd) {
      statusesToAdd = [];
    }

    if (!statusesToRemove) {
      statusesToRemove = [];
    }

    const statuses = uniq_1([...removeStatuses(item, statusesToRemove), ...statusesToAdd]);

    const updatedItem = _objectSpread({}, item, {
      statuses,
      lastUpdateTimestamp: new Date().getTime()
    });

    if (forceStartingPrice) {
      updatedItem.startingPrice = item.price;
    }

    if (newPrice) {
      updatedItem.price = newPrice;
    }

    return updatedItem;
  }

  function onConfirmURLForCreateItemAttempt(tabId, domain, url, selection, price, faviconURL, faviconAlt, callback) {
    const modalElementId = "price-tag--url-confirmation";
    chrome.tabs.sendMessage(tabId, {
      type: "CONFIRMATION_DISPLAY.CREATE",
      payload: {
        elementId: modalElementId
      }
    }, ({
      status
    }) => {
      if (status === 1) {
        const payload = buildURLConfirmationPayload(State.canonicalURL, State.browserURL, domain);
        chrome.tabs.sendMessage(tabId, {
          type: "CONFIRMATION_DISPLAY.LOAD",
          payload
        }, ({
          status,
          index
        }) => {
          chrome.tabs.sendMessage(tabId, {
            type: "CONFIRMATION_DISPLAY.REMOVE",
            payload: {
              elementId: modalElementId
            }
          });

          switch (status) {
            case 1:
              switch (index) {
                case 0:
                  // said Yes, can use canonical and remember this option
                  chrome.storage.local.get([domain], result => {
                    const domainState = result && result[domain] && JSON.parse(result[domain]) || {};
                    domainState._canUseCanonical = true;
                    chrome.storage.local.set({
                      [domain]: JSON.stringify(domainState)
                    });
                    State = StateFactory.updateCurrentURL(State, State.canonicalURL);
                    callback(true, true);
                  });
                  break;

                case 1:
                  // said Yes, but use canonical just this time
                  State = StateFactory.updateCurrentURL(State, State.canonicalURL);
                  callback(true, true);
                  break;

                case 2:
                  // said No, use browser URL and remember this option
                  chrome.storage.local.get([domain], result => {
                    const domainState = result && result[domain] && JSON.parse(result[domain]) || {};
                    domainState._canUseCanonical = false;
                    chrome.storage.local.set({
                      [domain]: JSON.stringify(domainState)
                    });
                    State = StateFactory.updateCurrentURL(State, State.browserURL);
                    callback(true, false);
                  });
                  break;

                case 3:
                  // said No, use browser URL but ask again
                  State = StateFactory.updateCurrentURL(State, State.browserURL);
                  callback(true, false);
                  break;

                default:
                  // cannot recognize this modal button click
                  callback(false);
                  break;
              }

              break;

            case 2:
              // close modal
              callback(false);
              break;

            default:
              callback(false);
              break;
          }
        });
      }
    });
  }

  function onRecordDone(tabId, payload) {
    const {
      status,
      selection,
      price,
      faviconURL,
      faviconAlt
    } = payload;
    const {
      currentURL,
      domain
    } = State;

    if (status > 0) {
      State = StateFactory.updateFaviconURL(State, State.faviconURL || faviconURL);
      canDisplayURLConfirmation(State, domain, canDisplay => {
        if (canDisplay) {
          onConfirmURLForCreateItemAttempt(tabId, domain, currentURL, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
            if (canSave) {
              const url = useCaninocal ? State.canonicalURL : State.browserURL;
              checkForURLSimilarity(tabId, domain, url, isToSave => {
                if (isToSave) {
                  createItem(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
                  updateExtensionAppearance(domain, url, true);
                }
              });
            }
          });
        } else {
          checkForURLSimilarity(tabId, domain, currentURL, isToSave => {
            if (isToSave) {
              createItem(domain, currentURL, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
              updateExtensionAppearance(domain, currentURL, true);
            }
          });
        }
      });
      State = StateFactory.disableRecord(State);
    }
  }

  function onRecordCancel() {
    State = StateFactory.disableRecord(State);
  }

  function onAutoSaveCheckStatus(sendResponse, {
    status,
    selection,
    price,
    faviconURL,
    faviconAlt
  } = {}) {
    if (status >= 0) {
      State = StateFactory.updateFaviconURL(State, State.faviconURL || faviconURL);
      State = StateFactory.setSelectionInfo(State, selection, price, State.faviconURL, faviconAlt);
      sendResponse(true);
    } else {
      sendResponse(false);
    }
  }

  function onPriceUpdateCheckStatus(sendResponse, trackedPrice, {
    status,
    selection,
    price,
    faviconURL,
    faviconAlt
  } = {}) {
    if (status >= 0) {
      State = StateFactory.updateFaviconURL(State, State.faviconURL || faviconURL);
      State = StateFactory.setSelectionInfo(State, selection, price, State.faviconURL, faviconAlt);

      if (toPrice(price) !== trackedPrice) {
        sendResponse(true);
        return;
      }
    }

    sendResponse(false);
  }

  function onSimilarElementHighlight({
    status,
    isHighlighted: isSimilarElementHighlighted,
    originalBackgroundColor = null
  }) {
    if (status >= 0) {
      State = StateFactory.setSimilarElementHighlight(State, isSimilarElementHighlighted, originalBackgroundColor);
    }
  } // TODO: price becomes a class


  function createItem(domain, url, selection, price, faviconURL, faviconAlt, statuses, callback) {
    chrome.storage.local.get([domain], result => {
      const items = result && result[domain] ? JSON.parse(result[domain]) : {};
      items[url] = ItemFactory.createItem(selection, toPrice(price), null, faviconURL, faviconAlt, statuses);
      chrome.storage.local.set({
        [domain]: JSON.stringify(items)
      }, () => {
        State = StateFactory.disableAutoSave(State);

        if (callback) {
          callback();
        } // TODO: sendResponse("done"); // foi gravado ou não

      });
    });
  }

  function canDisplayURLConfirmation(state, domain, callback) {
    chrome.storage.local.get([domain], result => {
      const domainState = result && result[domain] && JSON.parse(result[domain]) || null;
      const isUseCanonicalPrefUnset = !domainState || domainState._canUseCanonical === undefined;
      callback(isUseCanonicalPrefUnset && !!state.canonicalURL && state.canonicalURL !== state.browserURL);
    });
  }

  function checkForPriceChanges() {
    chrome.storage.local.get(null, result => {
      for (let domain in result) {
        if (result.hasOwnProperty(domain) && matchesDomain(domain)) {
          const domainItems = JSON.parse(result[domain]);

          for (let url in domainItems) {
            if (domainItems.hasOwnProperty(url) && matchesURL(url)) {
              const item = ItemFactory.createItemFromObject(domainItems[url]);

              if (item.isWatched()) {
                const {
                  price: targetPrice,
                  currentPrice
                } = item;
                onXHR(url, template => {
                  try {
                    let newPrice = null;
                    const {
                      textContent
                    } = template.querySelector(domainItems[url].selection);

                    if (textContent) {
                      const textContentMatch = textContent.match(MATCHES.PRICE);

                      if (textContentMatch) {
                        [, newPrice] = textContentMatch;
                        newPrice = toPrice(newPrice);

                        if (!targetPrice) {
                          item.updateTrackStatus(newPrice, [ITEM_STATUS.FIXED], [ITEM_STATUS.NOT_FOUND]);
                          domainItems[url] = item;
                          chrome.storage.local.set({
                            [domain]: JSON.stringify(domainItems)
                          }, () => {
                            const notificationId = `TRACK.PRICE_FIXED-${State.notificationsCounter}`;
                            createNotification(notificationId, PRICE_FIX_ICON, "Fixed price", `Ermm.. We've just fixed a wrongly set price to ${newPrice}`, url, url, domain);
                          });
                        } else if (newPrice < currentPrice) {
                          item.updateCurrentPrice(newPrice);
                          item.updateTrackStatus(null, [ITEM_STATUS.DECREASED], [ITEM_STATUS.INCREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_DECREASE]);
                          domainItems[url] = item;
                          chrome.storage.local.set({
                            [domain]: JSON.stringify(domainItems)
                          }, () => {
                            // TODO: sendResponse("done"); // foi actualizado ou não
                            if (newPrice < targetPrice && !item.hasAcknowledgeDecrease()) {
                              const notificationId = `TRACK.PRICE_UPDATE-${State.notificationsCounter}`;
                              createNotification(notificationId, PRICE_UPDATE_ICON, "Lower price!!", `${newPrice} (previous ${targetPrice})`, url, url, domain, ITEM_STATUS.DECREASED, {
                                buttons: [{
                                  title: `Keep tracking but w/ new price (${newPrice})`
                                }, {
                                  title: "Stop watching"
                                }]
                              });
                            }
                          });
                        } else if (newPrice > currentPrice) {
                          item.updateCurrentPrice(newPrice); // update current price and previous

                          item.updateTrackStatus(null, [ITEM_STATUS.INCREASED], [ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND, ITEM_STATUS.ACK_INCREASE]);
                          domainItems[url] = item;
                          chrome.storage.local.set({
                            [domain]: JSON.stringify(domainItems)
                          }, () => {
                            // TODO: sendResponse("done"); // foi actualizado ou não
                            if (!item.hasAcknowledgeIncrease()) {
                              const notificationId = `TRACK.PRICE_UPDATE-${State.notificationsCounter}`;
                              const notificationOptions = domainItems[url].price !== domainItems[url].previousPrice ? {
                                buttons: [{
                                  title: `Increase interest price to the previous (${domainItems[url].previousPrice})`
                                }]
                              } : {
                                buttons: []
                              };
                              notificationOptions.buttons.push({
                                title: "Stop watching"
                              });
                              createNotification(notificationId, PRICE_UPDATE_ICON, "Price increase", `${newPrice} (previous ${domainItems[url].previousPrice})`, url, url, domain, ITEM_STATUS.INCREASED, notificationOptions);
                            }
                          });
                        } else if (!item.isNotFound()) {
                          // NOTE: Here, price is the same
                          item.updateTrackStatus(null, null, [ITEM_STATUS.NOT_FOUND]);
                          domainItems[url] = item;
                          chrome.storage.local.set({
                            [domain]: JSON.stringify(domainItems)
                          }, () => {// TODO: sendResponse("done"); // foi actualizado ou não
                          });
                        } else {
                          item.updateTrackStatus(null, null, [ITEM_STATUS.NOT_FOUND]);
                          domainItems[url] = item;
                          chrome.storage.local.set({
                            [domain]: JSON.stringify(domainItems)
                          });
                        }
                      }
                    }

                    if (item.price && !newPrice) {
                      if (!item.isNotFound()) {
                        item.updateTrackStatus(null, [ITEM_STATUS.NOT_FOUND], [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);
                        domainItems[url] = item;
                        chrome.storage.local.set({
                          [domain]: JSON.stringify(domainItems)
                        }, () => {
                          // TODO: sendResponse("done"); // foi actualizado ou não
                          const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                          const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                          createNotification(notificationId, PRICE_NOT_FOUND_ICON, "Price gone", `Price tag no longer found${previousPrice}`, url, url, domain);
                        });
                      }
                    }
                  } catch (e) {
                    if (!item.isNotFound()) {
                      console.warn(`Invalid price selection element in\n${url}:\t"${domainItems[url].selection}"`);
                      item.updateTrackStatus(null, [ITEM_STATUS.NOT_FOUND], [ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.FIXED, ITEM_STATUS.ACK_DECREASE]);
                      domainItems[url] = item;
                      chrome.storage.local.set({
                        [domain]: JSON.stringify(domainItems)
                      }, () => {
                        const notificationId = `TRACK.PRICE_NOT_FOUND-${State.notificationsCounter}`;
                        const previousPrice = targetPrice ? ` (previous ${targetPrice})` : "";
                        createNotification(notificationId, PRICE_NOT_FOUND_ICON, "Price gone", `Price tag no longer found${previousPrice}`, url, url, domain);
                      });
                    }
                  }
                });
              }
            }
          }
        }
      }
    });
  }

  function getTrackedItemsSortedBy(sortType, callback) {
    chrome.storage.local.get(null, result => {
      let trackedItems = [];
      Object.keys(result).forEach(key => {
        if (matchesDomain(key)) {
          const domainData = result[key];
          const domainItems = JSON.parse(domainData) || null;

          if (domainItems) {
            let items = [];
            Object.keys(domainItems).forEach(url => {
              if (matchesHostname(url)) {
                const item = ItemFactory.createItemFromObject(domainItems[url]);

                if (item.isWatched()) {
                  items.push(_objectSpread({}, item, {
                    url
                  }));
                }
              }
            });
            trackedItems = [...trackedItems, ...items];
          }
        }
      });
      const sortByFn = sortTrackedItemsBy[sortType];
      trackedItems.sort(sortByFn);
      callback(trackedItems);
    });
  }

  function removeTrackedItem(url, currentURL, callback) {
    let found = false;
    chrome.storage.local.get(null, result => {
      Object.keys(result).forEach(domain => {
        if (matchesDomain(domain)) {
          const domainData = result[domain];
          const domainItems = JSON.parse(domainData) || null;

          if (domainItems[url]) {
            found = true;

            if (State._undoRemovedItemsResetTask) {
              clearTimeout(State._undoRemovedItemsResetTask);
              State = StateFactory.setUndoRemovedItemsResetTask(State, null);
            }

            const removedItem = _objectSpread({}, domainItems[url]);

            State = StateFactory.addUndoRemovedItem(State, url, removedItem, MAX_UNDO_REMOVED_ITEMS);
            chrome.runtime.sendMessage({
              type: "TRACKED_ITEMS.UNDO_STATUS",
              payload: {
                isUndoStatusActive: true
              }
            });
            const undoRemovedItemsTask = setTimeout(() => {
              State = StateFactory.resetUndoRemovedItems(State);
              chrome.runtime.sendMessage({
                type: "TRACKED_ITEMS.UNDO_STATUS",
                payload: {
                  isUndoStatusActive: false
                }
              });
            }, UNDO_REMOVED_ITEMS_TIMEOUT);
            State = StateFactory.setUndoRemovedItemsResetTask(State, undoRemovedItemsTask);
            domainItems[url] = updateItemTrackStatus(domainItems[url], null, null, [ITEM_STATUS.WATCHED]); // stop watching

            chrome.storage.local.set({
              [domain]: JSON.stringify(domainItems)
            }, () => {
              if (currentURL === url) {
                updateAutoSaveStatus(url, domain);
                updatePriceUpdateStatus(url, domain);
                updateExtensionAppearance(domain, url, false);
              }

              callback(true);
            });
          }
        }
      });

      if (!found) {
        callback(false);
      }
    });
  }

  function undoRemoveTrackedItem(url, currentURL, callback) {
    let found = false;
    chrome.storage.local.get(null, result => {
      Object.keys(result).forEach(domain => {
        if (matchesDomain(domain)) {
          const domainData = result[domain];
          const domainItems = JSON.parse(domainData) || null;

          if (domainItems[url]) {
            found = true;
            domainItems[url] = updateItemTrackStatus(domainItems[url], null, [ITEM_STATUS.WATCHED], null); // start watch again

            chrome.storage.local.set({
              [domain]: JSON.stringify(domainItems)
            }, () => {
              if (currentURL === url) {
                updateAutoSaveStatus(url, domain);
                updatePriceUpdateStatus(url, domain);
                updateExtensionAppearance(domain, url, true);
              }

              callback(true);
            });
          }
        }
      });

      if (!found) {
        // No special treatment if item is not found; we can't undo nothing
        callback(true);
      }
    });
  }

  function clearNotification(notifId, wasClosedByUser) {
    chrome.notifications.clear(notifId, wasClickedByUser => {
      if (wasClickedByUser || wasClosedByUser) {
        const {
          domain,
          url,
          type
        } = State.notifications[notifId];
        chrome.storage.local.get([domain], result => {
          const domainItems = result && result[domain] ? JSON.parse(result[domain]) : null;

          switch (type) {
            case ITEM_STATUS.DECREASED:
              domainItems[url] = updateItemTrackStatus(domainItems[url], null, [ITEM_STATUS.ACK_DECREASE]);
              break;

            case ITEM_STATUS.INCREASED:
              domainItems[url] = updateItemTrackStatus(domainItems[url], null, [ITEM_STATUS.ACK_INCREASE]);
              break;
          }

          chrome.storage.local.set({
            [domain]: JSON.stringify(domainItems)
          });
        });
      }

      State = StateFactory.deleteNotificationsItem(State, notifId);
    });
  }

  function createNotification(notifId, iconUrl, title, message, contextMessage = "", url, domain, type, extraOptions = {}) {
    const options = _objectSpread({
      type: "basic",
      title,
      message,
      iconUrl,
      contextMessage,
      requireInteraction: true
    }, extraOptions);

    chrome.notifications.create(notifId, options, id => {
      State = StateFactory.updateNotificationsItem(State, id, {
        url,
        domain,
        type
      });
    });
    State = StateFactory.incrementNotificationsCounter(State);
  }

  function setupTrackingPolling() {
    checkForPriceChanges();
    setInterval(checkForPriceChanges, PRICE_CHECKING_INTERVAL);
  }

  function updateAutoSaveStatus(url, domain, fullURL) {
    chrome.storage.local.get([domain], result => {
      const items = result && result[domain] ? JSON.parse(result[domain]) : {};
      const item = items[url] && ItemFactory.createItemFromObject(items[url]);
      const itemFallback = items[fullURL] && ItemFactory.createItemFromObject(items[fullURL]);
      const isItemDefinedAndWatched = item && item.isWatched() || itemFallback && itemFallback.isWatched();

      if (items && !isItemDefinedAndWatched) {
        const urlFromDomain = Object.keys(items)[0];
        const exampleFromDomain = items[urlFromDomain] && ItemFactory.createItemFromObject(items[urlFromDomain]);

        if (exampleFromDomain && exampleFromDomain.selection) {
          State = StateFactory.enableAutoSave(State, exampleFromDomain.selection);
        }
      } else {
        State = StateFactory.disableAutoSave(State);
      }
    });
  }

  function updatePriceUpdateStatus(url, domain) {
    chrome.storage.local.get([domain], result => {
      const items = result && result[domain] ? JSON.parse(result[domain]) : {};
      const item = items[url];
      const hasItemPriceIncOrDec = item && item.price !== item.currentPrice;

      if (hasItemPriceIncOrDec) {
        State = StateFactory.enablePriceUpdate(State, item.selection);
      } else {
        State = StateFactory.disablePriceUpdate(State);
      }
    });
  }

  function updateExtensionAppearance(currentDomain, currentURL, forcePageTrackingTo, fullURL) {
    if (forcePageTrackingTo === true) {
      setTrackedItemAppearance();
      State = StateFactory.enableCurrentPageTracked(State);
    } else if (forcePageTrackingTo === false) {
      setDefaultAppearance();
      State = StateFactory.disableCurrentPageTracked(State);
    } else if (!forcePageTrackingTo) {
      chrome.storage.local.get([currentDomain], result => {
        const domainState = parseDomainState(result, currentDomain);

        if (domainState) {
          // NOTE: Making sure that full URL is also checked because item may have been saved with full URL
          // in the past
          const itemObject = domainState[currentURL] || domainState[fullURL];
          const item = itemObject && ItemFactory.createItemFromObject(itemObject);

          if (item && item.isWatched()) {
            setTrackedItemAppearance();
            State = StateFactory.enableCurrentPageTracked(State);
          } else {
            setDefaultAppearance();
            State = StateFactory.disableCurrentPageTracked(State);
          }
        } else {
          setDefaultAppearance();
          State = StateFactory.disableCurrentPageTracked(State);
        }
      });
    }
  }

  function searchForEqualPathWatchedItem(domainState, currentURL, callback) {
    const currentHostAndPath = captureHostAndPathFromURL(currentURL);

    for (let url in domainState) {
      if (domainState.hasOwnProperty(url) && matchesURL(url)) {
        const item = ItemFactory.createItemFromObject(domainState[url]);

        if (item.isWatched()) {
          if (currentURL === url) {
            //    if they're exactly the same
            callback(null);
            return;
          } else {
            const hostAndPath = captureHostAndPathFromURL(url);

            if (hostAndPath === currentHostAndPath) {
              callback(url);
              return;
            }
          }
        }
      }
    }

    callback(null);
  }

  function checkForURLSimilarity(tabId, domain, currentURL, callback) {
    chrome.storage.local.get([domain], result => {
      const domainState = result && result[domain] && JSON.parse(result[domain]) || null;

      if (domainState) {
        if (domainState._isPathEnoughToTrack === true) {
          // since it's true we can say that that domain items' path is enough to track items in this domain
          searchForEqualPathWatchedItem(domainState, currentURL, similarURL => {
            if (similarURL) {
              callback(false, false);
            } else {
              callback(true);
            }
          });
        } else if (domainState._isPathEnoughToTrack === false) {
          callback(true);
        } else {
          // it's the first time user is being inquired about items similarity in this domain
          searchForEqualPathWatchedItem(domainState, currentURL, similarURL => {
            if (similarURL) {
              // found an URL whose host and path are equals to the currentURL trying to be saved
              // prompt user to confirm if the item is the same
              const modalElementId = "price-tag--save-confirmation";
              chrome.tabs.sendMessage(tabId, {
                type: "CONFIRMATION_DISPLAY.CREATE",
                payload: {
                  elementId: modalElementId
                }
              }, ({
                status
              }) => {
                if (status === 1) {
                  const payload = buildSaveConfirmationPayload(currentURL, similarURL);
                  chrome.tabs.sendMessage(tabId, {
                    type: "CONFIRMATION_DISPLAY.LOAD",
                    payload
                  }, ({
                    status,
                    index
                  }) => {
                    chrome.tabs.sendMessage(tabId, {
                      type: "CONFIRMATION_DISPLAY.REMOVE",
                      payload: {
                        elementId: modalElementId
                      }
                    });

                    switch (status) {
                      case 1:
                        switch (index) {
                          case 0:
                            // said Yes: not the same item
                            domainState._isPathEnoughToTrack = false;
                            chrome.storage.local.set({
                              [domain]: JSON.stringify(domainState)
                            });
                            callback(true);
                            break;

                          case 1:
                            callback(false, true);
                            break;

                          case 2:
                            // said No: same item (path is enough for this site items)
                            domainState._isPathEnoughToTrack = true;
                            chrome.storage.local.set({
                              [domain]: JSON.stringify(domainState)
                            });
                            callback(false, false);
                            break;

                          case 3:
                            // said Save this but for others Ask me later
                            callback(true);
                            break;

                          default:
                            // cannot recognize this modal button click
                            callback(false, true);
                            break;
                        }

                        break;

                      case 2:
                        // close modal
                        callback(false, true);
                        break;

                      default:
                        // something wrong with modal interaction
                        callback(false, true);
                        break;
                    }
                  });
                } else {
                  // something went wrong creating the modal
                  callback(false, true);
                }
              });
            } else {
              // no URL has host and path equals to the currentURL (can save the item)
              callback(true);
            }
          });
        }
      } else {
        // this means it's the first item being saved belonging to this domain (can save the item)
        callback(true);
      }
    });
  }

  function onXHR(url, callback) {
    const request = new XMLHttpRequest();

    request.onload = function () {
      const template = createHTMLTemplate(this.response);
      callback(template);
    };

    request.open("GET", url);
    request.send();
  }

  function onTabContextChange(tabId, url) {
    const captureDomain = url.match(MATCHES.CAPTURE.DOMAIN_IN_URL);

    if (captureDomain) {
      const [, domain] = captureDomain;
      State = StateFactory.updateCurrentDomain(State, domain);
      chrome.storage.local.get([domain], result => {
        const domainState = result && result[domain] && JSON.parse(result[domain]) || null; // check if user has already a preference to use the canonical URL if available

        if (domainState && domainState._canUseCanonical === false) {
          State = StateFactory.updateCanonicalURL(State, null);
          State = StateFactory.updateCurrentURL(State, url);
          State = StateFactory.updateBrowserURL(State, url);

          if (domainState._isPathEnoughToTrack === true) {
            const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);

            if (protocolHostAndPathFromURL) {
              State = StateFactory.updateCurrentURL(State, protocolHostAndPathFromURL);
              State = StateFactory.updateBrowserURL(State, protocolHostAndPathFromURL);
            }
          }

          updateAutoSaveStatus(State.currentURL, State.domain, url);
          updatePriceUpdateStatus(State.currentURL, State.domain);
          updateExtensionAppearance(State.domain, State.currentURL, null, url);
        } else {
          // First thing to do, check:
          // If canonical was updated (compared to the previously) + if it's relevant
          State = StateFactory.updateBrowserURL(State, url);
          onXHR(url, template => {
            const canonicalURL = getCanonicalPathFromSource(template);
            const canUseCanonical = isCanonicalURLRelevant(canonicalURL);

            if (canUseCanonical) {
              State = StateFactory.updateCurrentURL(State, canonicalURL);
              State = StateFactory.updateCanonicalURL(State, canonicalURL);
            } else {
              State = StateFactory.updateCanonicalURL(State, null);
              State = StateFactory.updateCurrentURL(State, url);

              if (domainState && domainState._isPathEnoughToTrack === true) {
                const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);

                if (protocolHostAndPathFromURL) {
                  State = StateFactory.updateCurrentURL(State, protocolHostAndPathFromURL);
                  State = StateFactory.updateBrowserURL(State, protocolHostAndPathFromURL);
                }
              }
            }

            updateAutoSaveStatus(State.currentURL, State.domain, url);
            updatePriceUpdateStatus(State.currentURL, State.domain);
            updateExtensionAppearance(State.domain, State.currentURL, null, url);
          });
        }
      });
    }
  } // TODO: break this down into smaller functions


  function attachEvents() {
    chrome.runtime.onInstalled.addListener(() => {
      console.log("Price tag installed.");
    });
    chrome.tabs.onActivated.addListener(() => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, ([{
        id,
        url
      }]) => {
        if (url.startsWith("http")) {
          onTabContextChange(id, url);
          State = StateFactory.updateFaviconURL(State, State._faviconURLMap[id] || null);
        } else {
          setDefaultAppearance();
        }
      });
    });
    chrome.tabs.onUpdated.addListener((tabId, {
      favIconUrl
    }, {
      active,
      url
    }) => {
      if (url.startsWith("http")) {
        if (active) {
          if (favIconUrl) {
            State = StateFactory.updateFaviconURLMapItem(State, tabId, favIconUrl);
            State = StateFactory.updateFaviconURL(State, favIconUrl);
          }
        }
      } else {
        setDefaultAppearance();
      }
    });
    chrome.webNavigation.onCompleted.addListener(({
      frameId
    }) => {
      if (frameId === 0) {
        chrome.tabs.query({
          active: true,
          currentWindow: true
        }, tabs => {
          if (tabs.length > 0) {
            const [{
              id,
              url
            }] = tabs;
            onTabContextChange(id, url);
          }
        });
      }
    });
    chrome.webNavigation.onHistoryStateUpdated.addListener(() => {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, tabs => {
        if (tabs.length > 0) {
          const [{
            id: tabId,
            url
          }] = tabs;

          if (url !== undefined && url !== State.browserURL) {
            onTabContextChange(tabId, url);
          }
        }
      });
    });
    chrome.runtime.onMessage.addListener(({
      type,
      payload = {}
    }, sender, sendResponse) => {
      let isUndoStatusActive;
      const {
        id,
        url: itemUrl,
        sortByType
      } = payload;
      const {
        recordActive,
        autoSaveEnabled,
        isPriceUpdateEnabled,
        currentURL: url,
        domain
      } = State;

      switch (type) {
        case "POPUP.STATUS":
          sendResponse({
            status: 1,
            state: {
              recordActive,
              autoSaveEnabled,
              isPriceUpdateEnabled
            }
          });
          break;

        case "RECORD.ATTEMPT":
          State = StateFactory.toggleRecord(State);

          if (State.recordActive) {
            const {
              url
            } = payload;
            chrome.tabs.sendMessage(id, {
              type: "RECORD.START",
              payload: {
                url
              }
            }, onRecordDone.bind(null, id));
          } else {
            chrome.tabs.sendMessage(id, {
              type: "RECORD.CANCEL"
            }, onRecordCancel);
          }

          sendResponse({
            status: 1,
            state: {
              recordActive: State.recordActive
            }
          });
          break;

        case "AUTO_SAVE.STATUS":
          chrome.storage.local.get([domain], result => {
            const domainState = result && result[domain] && JSON.parse(result[domain]) || null;

            if (domainState) {
              if (domainState._isPathEnoughToTrack === true) {
                // since it's true we can say that that domain items' path is enough to track items in this domain
                searchForEqualPathWatchedItem(domainState, url, similarURL => {
                  if (!similarURL) {
                    chrome.tabs.sendMessage(id, {
                      type: "AUTO_SAVE.CHECK_STATUS",
                      payload: {
                        url,
                        selection: State.selection
                      }
                    }, onAutoSaveCheckStatus.bind(null, sendResponse));
                  } else {
                    sendResponse({
                      status: -1
                    });
                  }
                });
              } else {
                chrome.tabs.sendMessage(id, {
                  type: "AUTO_SAVE.CHECK_STATUS",
                  payload: {
                    url,
                    selection: State.selection
                  }
                }, onAutoSaveCheckStatus.bind(null, sendResponse));
              }
            } else {
              // domain doesn't exist
              chrome.tabs.sendMessage(id, {
                type: "AUTO_SAVE.CHECK_STATUS",
                payload: {
                  url,
                  selection: State.selection
                }
              }, onAutoSaveCheckStatus.bind(null, sendResponse));
            }
          });
          return true;

        case "AUTO_SAVE.ATTEMPT":
          if (State.autoSaveEnabled) {
            const {
              domain,
              currentURL: stateUrl,
              selection,
              price,
              faviconURL,
              faviconAlt,
              originalBackgroundColor
            } = State;
            canDisplayURLConfirmation(State, domain, canDisplay => {
              if (canDisplay) {
                onConfirmURLForCreateItemAttempt(id, domain, stateUrl, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
                  if (canSave) {
                    const url = useCaninocal ? State.canonicalURL : State.browserURL;
                    checkForURLSimilarity(id, domain, url, (isToSave, autoSaveStatus) => {
                      if (isToSave) {
                        createItem(domain, url, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED], () => {
                          chrome.tabs.sendMessage(id, {
                            type: "PRICE_TAG.HIGHLIGHT.STOP",
                            payload: {
                              selection,
                              originalBackgroundColor
                            }
                          }, onSimilarElementHighlight);
                          updateExtensionAppearance(domain, url, true);
                          State = StateFactory.disableAutoSave(State);
                          sendResponse(false);
                        });
                      } else {
                        // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                        if (!autoSaveStatus) {
                          State = StateFactory.disableAutoSave(State);
                        }
                      }
                    });
                  }
                });
              } else {
                checkForURLSimilarity(id, domain, stateUrl, isToSave => {
                  if (isToSave) {
                    createItem(domain, stateUrl, selection, price, faviconURL, faviconAlt, [ITEM_STATUS.WATCHED], () => {
                      chrome.tabs.sendMessage(id, {
                        type: "PRICE_TAG.HIGHLIGHT.STOP",
                        payload: {
                          selection,
                          originalBackgroundColor
                        }
                      }, onSimilarElementHighlight);
                      updateExtensionAppearance(domain, stateUrl, true);
                      State = StateFactory.disableAutoSave(State);
                      sendResponse(false);
                    });
                  }
                });
              }
            });
            return true;
          } else {
            sendResponse(false);
          }

          break;

        case "AUTO_SAVE.HIGHLIGHT.PRE_START":
          if (State.autoSaveEnabled) {
            const {
              selection
            } = State;
            chrome.tabs.sendMessage(id, {
              type: "PRICE_TAG.HIGHLIGHT.START",
              payload: {
                selection
              }
            }, onSimilarElementHighlight);
          }

          break;

        case "AUTO_SAVE.HIGHLIGHT.PRE_STOP":
          if (State.autoSaveEnabled) {
            const {
              selection,
              originalBackgroundColor
            } = State;
            chrome.tabs.sendMessage(id, {
              type: "PRICE_TAG.HIGHLIGHT.STOP",
              payload: {
                selection,
                originalBackgroundColor
              }
            }, onSimilarElementHighlight);
          }

          break;

        case "PRICE_UPDATE.STATUS":
          chrome.storage.local.get([State.domain], result => {
            const domainItems = result && result[State.domain] ? JSON.parse(result[State.domain]) : {};
            const item = domainItems[State.currentURL];

            if (item) {
              chrome.tabs.sendMessage(id, {
                type: "PRICE_UPDATE.CHECK_STATUS",
                payload: {
                  selection: State.selection
                }
              }, onPriceUpdateCheckStatus.bind(null, sendResponse, item.price));
            } else {
              sendResponse(false);
            }
          });
          return true;

        case "PRICE_UPDATE.ATTEMPT":
          if (State.isPriceUpdateEnabled) {
            const {
              domain,
              currentURL: stateUrl,
              selection,
              price: updatedPrice,
              originalBackgroundColor
            } = State;
            const price = updatedPrice && toPrice(updatedPrice);
            chrome.storage.local.get([domain], result => {
              const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
              domainItems[stateUrl] = updateItemTrackStatus(domainItems[stateUrl], price, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE, ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE, ITEM_STATUS.DECREASED, ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND]);
              domainItems[stateUrl] = updateItemDiffPercentage(domainItems[stateUrl]);
              chrome.storage.local.set({
                [domain]: JSON.stringify(domainItems)
              });
              chrome.tabs.sendMessage(id, {
                type: "PRICE_TAG.HIGHLIGHT.STOP",
                payload: {
                  selection,
                  originalBackgroundColor
                }
              }, onSimilarElementHighlight);
              State = StateFactory.disablePriceUpdate(State);
              sendResponse(false);
            });
          }

          return true;

        case "PRICE_UPDATE.HIGHLIGHT.PRE_START":
          if (State.isPriceUpdateEnabled) {
            const {
              selection
            } = State;
            chrome.tabs.sendMessage(id, {
              type: "PRICE_TAG.HIGHLIGHT.START",
              payload: {
                selection
              }
            }, onSimilarElementHighlight);
          }

          break;

        case "PRICE_UPDATE.HIGHLIGHT.PRE_STOP":
          if (State.isPriceUpdateEnabled) {
            const {
              selection,
              originalBackgroundColor
            } = State;
            chrome.tabs.sendMessage(id, {
              type: "PRICE_TAG.HIGHLIGHT.STOP",
              payload: {
                selection,
                originalBackgroundColor
              }
            }, onSimilarElementHighlight);
          }

          break;

        case "TRACKED_ITEMS.OPEN":
          State = StateFactory.updateSortItemsBy(State, TIME);
          isUndoStatusActive = State._undoRemovedItems.length > 0;
          sendResponse({
            isUndoStatusActive
          });
          break;

        case "TRACKED_ITEMS.GET":
          getTrackedItemsSortedBy(State._sortItemsBy, sendResponse);
          return true;

        case "TRACKED_ITEMS.UNFOLLOW":
          removeTrackedItem(itemUrl, State.currentURL, sendResponse);
          return true;

        case "TRACKED_ITEMS.CHANGE_SORT":
          State = StateFactory.updateSortItemsBy(State, SORT_BY_TYPES[sortByType]);
          break;

        case "TRACKED_ITEMS.UNDO_ATTEMPT":
          if (State._undoRemovedItems.length > 0) {
            const undoRemovedItem = StateFactory.getUndoRemovedItemsHead(State);
            undoRemoveTrackedItem(undoRemovedItem.url, State.currentURL, response => {
              if (response) {
                State = StateFactory.removeUndoRemovedItem(State);
                State._undoRemovedItems.length === 0 ? sendResponse({
                  isUndoStatusActive: false
                }) : sendResponse({
                  isUndoStatusActive: true
                });
              }
            });
            return true;
          } else {
            sendResponse({
              isUndoStatusActive: false
            });
          }

          break;
      }
    });
    chrome.notifications.onClicked.addListener(notifId => {
      chrome.tabs.create({
        url: State.notifications[notifId].url
      });
      clearNotification(notifId);
    }); // TODO: update and keep tracking

    chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
      const {
        domain,
        url,
        type
      } = State.notifications[notifId];

      switch (buttonIndex) {
        case 0:
          switch (type) {
            case ITEM_STATUS.DECREASED:
              chrome.storage.local.get([domain], result => {
                const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};

                if (domainItems[url]) {
                  const {
                    price: newPrice
                  } = domainItems[url];
                  domainItems[url] = updateItemTrackStatus(domainItems[url], newPrice, null, [ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE], true);
                  chrome.storage.local.set({
                    [domain]: JSON.stringify(domainItems)
                  });
                }
              });
              break;

            case ITEM_STATUS.INCREASED:
              chrome.storage.local.get([domain], result => {
                const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};

                if (domainItems[url]) {
                  const {
                    previousPrice: priceBeforeIncreasing
                  } = domainItems[url];
                  domainItems[url] = updateItemTrackStatus(domainItems[url], priceBeforeIncreasing, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE], true);
                  chrome.storage.local.set({
                    [domain]: JSON.stringify(domainItems)
                  });
                }
              });
              break;
          }

          break;

        case 1:
          switch (type) {
            case (ITEM_STATUS.INCREASED):
              chrome.storage.local.get([domain], result => {
                const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};

                if (domainItems[url]) {
                  domainItems[url] = updateItemTrackStatus(domainItems[url], null, null, ITEM_STATUS.ALL_STATUSES); // stop watching

                  chrome.storage.local.set({
                    [domain]: JSON.stringify(domainItems)
                  });
                }
              });
              break;
          }

          break;
      }
    });
    chrome.notifications.onClosed.addListener(clearNotification);
  }

  function setupSyncStorageState() {
    syncStorageState();
    setInterval(syncStorageState, SYNCHING_INTERVAL);
  }

  function bootstrap() {
    setupSyncStorageState();
    setupTrackingPolling();
    attachEvents();
  }

  bootstrap();

}());
//# sourceMappingURL=background.js.map
