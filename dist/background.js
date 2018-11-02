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

  const TIME = "TIME";
  const CURRENT_PRICE = "CURRENT_PRICE";

  var SORT_BY_TYPES = /*#__PURE__*/Object.freeze({
    TIME: TIME,
    CURRENT_PRICE: CURRENT_PRICE
  });

  const PRICE_CHECKING_INTERVAL = 20000;
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

  /**
   * The base implementation of methods like `_.findKey` and `_.findLastKey`,
   * without support for iteratee shorthands, which iterates over `collection`
   * using `eachFunc`.
   *
   * @private
   * @param {Array|Object} collection The collection to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {Function} eachFunc The function to iterate over `collection`.
   * @returns {*} Returns the found element or its key, else `undefined`.
   */
  function baseFindKey(collection, predicate, eachFunc) {
    var result;
    eachFunc(collection, function(value, key, collection) {
      if (predicate(value, key, collection)) {
        result = key;
        return false;
      }
    });
    return result;
  }

  var _baseFindKey = baseFindKey;

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function(object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  var _createBaseFor = createBaseFor;

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = _createBaseFor();

  var _baseFor = baseFor;

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  var _baseTimes = baseTimes;

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

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
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && typeof value == 'object';
  }

  var isObjectLike_1 = isObjectLike;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]';

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
  }

  var _baseIsArguments = baseIsArguments;

  /** Used for built-in method references. */
  var objectProto$2 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto$2.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
    return isObjectLike_1(value) && hasOwnProperty$1.call(value, 'callee') &&
      !propertyIsEnumerable.call(value, 'callee');
  };

  var isArguments_1 = isArguments;

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  var isArray_1 = isArray;

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  var stubFalse_1 = stubFalse;

  var isBuffer_1 = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? _root.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse_1;

  module.exports = isBuffer;
  });

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    var type = typeof value;
    length = length == null ? MAX_SAFE_INTEGER : length;

    return !!length &&
      (type == 'number' ||
        (type != 'symbol' && reIsUint.test(value))) &&
          (value > -1 && value % 1 == 0 && value < length);
  }

  var _isIndex = isIndex;

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER$1 = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' &&
      value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
  }

  var isLength_1 = isLength;

  /** `Object#toString` result references. */
  var argsTag$1 = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
  typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
  typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
  typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
  typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
  typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
  typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
  typedArrayTags[errorTag] = typedArrayTags[funcTag] =
  typedArrayTags[mapTag] = typedArrayTags[numberTag] =
  typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
  typedArrayTags[setTag] = typedArrayTags[stringTag] =
  typedArrayTags[weakMapTag] = false;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike_1(value) &&
      isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
  }

  var _baseIsTypedArray = baseIsTypedArray;

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function(value) {
      return func(value);
    };
  }

  var _baseUnary = baseUnary;

  var _nodeUtil = createCommonjsModule(function (module, exports) {
  /** Detect free variable `exports`. */
  var freeExports = exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && _freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = (function() {
    try {
      // Use `util.types` for Node.js 10+.
      var types = freeModule && freeModule.require && freeModule.require('util').types;

      if (types) {
        return types;
      }

      // Legacy `process.binding('util')` for Node.js < 10.
      return freeProcess && freeProcess.binding && freeProcess.binding('util');
    } catch (e) {}
  }());

  module.exports = nodeUtil;
  });

  /* Node.js helper references. */
  var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

  var isTypedArray_1 = isTypedArray;

  /** Used for built-in method references. */
  var objectProto$3 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray_1(value),
        isArg = !isArr && isArguments_1(value),
        isBuff = !isArr && !isArg && isBuffer_1(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? _baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty$2.call(value, key)) &&
          !(skipIndexes && (
             // Safari 9 has enumerable `arguments.length` in strict mode.
             key == 'length' ||
             // Node.js 0.10 has enumerable non-index properties on buffers.
             (isBuff && (key == 'offset' || key == 'parent')) ||
             // PhantomJS 2 has enumerable non-index properties on typed arrays.
             (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
             // Skip index properties.
             _isIndex(key, length)
          ))) {
        result.push(key);
      }
    }
    return result;
  }

  var _arrayLikeKeys = arrayLikeKeys;

  /** Used for built-in method references. */
  var objectProto$4 = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$4;

    return value === proto;
  }

  var _isPrototype = isPrototype;

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function(arg) {
      return func(transform(arg));
    };
  }

  var _overArg = overArg;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = _overArg(Object.keys, Object);

  var _nativeKeys = nativeKeys;

  /** Used for built-in method references. */
  var objectProto$5 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$3 = objectProto$5.hasOwnProperty;

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!_isPrototype(object)) {
      return _nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty$3.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  var _baseKeys = baseKeys;

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
      funcTag$1 = '[object Function]',
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
    return tag == funcTag$1 || tag == genTag || tag == asyncTag || tag == proxyTag;
  }

  var isFunction_1 = isFunction;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength_1(value.length) && !isFunction_1(value);
  }

  var isArrayLike_1 = isArrayLike;

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
  }

  var keys_1 = keys;

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && _baseFor(object, iteratee, keys_1);
  }

  var _baseForOwn = baseForOwn;

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

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new _ListCache;
    this.size = 0;
  }

  var _stackClear = stackClear;

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  var _stackDelete = stackDelete;

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  var _stackGet = stackGet;

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  var _stackHas = stackHas;

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
      objectProto$6 = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString$1 = funcProto$1.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' +
    funcToString$1.call(hasOwnProperty$4).replace(reRegExpChar, '\\$&')
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
  var Map$1 = _getNative(_root, 'Map');

  var _Map = Map$1;

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
  var objectProto$7 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

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
    return hasOwnProperty$5.call(data, key) ? data[key] : undefined;
  }

  var _hashGet = hashGet;

  /** Used for built-in method references. */
  var objectProto$8 = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

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
    return _nativeCreate ? (data[key] !== undefined) : hasOwnProperty$6.call(data, key);
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

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof _ListCache) {
      var pairs = data.__data__;
      if (!_Map || (pairs.length < LARGE_ARRAY_SIZE - 1)) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new _MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  var _stackSet = stackSet;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new _ListCache(entries);
    this.size = data.size;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = _stackClear;
  Stack.prototype['delete'] = _stackDelete;
  Stack.prototype.get = _stackGet;
  Stack.prototype.has = _stackHas;
  Stack.prototype.set = _stackSet;

  var _Stack = Stack;

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
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  var _arraySome = arraySome;

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

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG = 1,
      COMPARE_UNORDERED_FLAG = 2;

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
        result = true,
        seen = (bitmask & COMPARE_UNORDERED_FLAG) ? new _SetCache : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, arrValue, index, other, array, stack)
          : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!_arraySome(other, function(othValue, othIndex) {
              if (!_cacheHas(seen, othIndex) &&
                  (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
                return seen.push(othIndex);
              }
            })) {
          result = false;
          break;
        }
      } else if (!(
            arrValue === othValue ||
              equalFunc(arrValue, othValue, bitmask, customizer, stack)
          )) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  var _equalArrays = equalArrays;

  /** Built-in value references. */
  var Uint8Array = _root.Uint8Array;

  var _Uint8Array = Uint8Array;

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function(value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  var _mapToArray = mapToArray;

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

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$1 = 1,
      COMPARE_UNORDERED_FLAG$1 = 2;

  /** `Object#toString` result references. */
  var boolTag$1 = '[object Boolean]',
      dateTag$1 = '[object Date]',
      errorTag$1 = '[object Error]',
      mapTag$1 = '[object Map]',
      numberTag$1 = '[object Number]',
      regexpTag$1 = '[object RegExp]',
      setTag$1 = '[object Set]',
      stringTag$1 = '[object String]',
      symbolTag = '[object Symbol]';

  var arrayBufferTag$1 = '[object ArrayBuffer]',
      dataViewTag$1 = '[object DataView]';

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
    switch (tag) {
      case dataViewTag$1:
        if ((object.byteLength != other.byteLength) ||
            (object.byteOffset != other.byteOffset)) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag$1:
        if ((object.byteLength != other.byteLength) ||
            !equalFunc(new _Uint8Array(object), new _Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag$1:
      case dateTag$1:
      case numberTag$1:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq_1(+object, +other);

      case errorTag$1:
        return object.name == other.name && object.message == other.message;

      case regexpTag$1:
      case stringTag$1:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == (other + '');

      case mapTag$1:
        var convert = _mapToArray;

      case setTag$1:
        var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1;
        convert || (convert = _setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= COMPARE_UNORDERED_FLAG$1;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = _equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
        stack['delete'](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  var _equalByTag = equalByTag;

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  var _arrayPush = arrayPush;

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray_1(object) ? result : _arrayPush(result, symbolsFunc(object));
  }

  var _baseGetAllKeys = baseGetAllKeys;

  /**
   * A specialized version of `_.filter` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {Array} Returns the new filtered array.
   */
  function arrayFilter(array, predicate) {
    var index = -1,
        length = array == null ? 0 : array.length,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (predicate(value, index, array)) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  var _arrayFilter = arrayFilter;

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  var stubArray_1 = stubArray;

  /** Used for built-in method references. */
  var objectProto$9 = Object.prototype;

  /** Built-in value references. */
  var propertyIsEnumerable$1 = objectProto$9.propertyIsEnumerable;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own enumerable symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = !nativeGetSymbols ? stubArray_1 : function(object) {
    if (object == null) {
      return [];
    }
    object = Object(object);
    return _arrayFilter(nativeGetSymbols(object), function(symbol) {
      return propertyIsEnumerable$1.call(object, symbol);
    });
  };

  var _getSymbols = getSymbols;

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return _baseGetAllKeys(object, keys_1, _getSymbols);
  }

  var _getAllKeys = getAllKeys;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$2 = 1;

  /** Used for built-in method references. */
  var objectProto$a = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$7 = objectProto$a.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
    var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2,
        objProps = _getAllKeys(object),
        objLength = objProps.length,
        othProps = _getAllKeys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty$7.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial
          ? customizer(othValue, objValue, key, other, object, stack)
          : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined
            ? (objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack))
            : compared
          )) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor &&
          ('constructor' in object && 'constructor' in other) &&
          !(typeof objCtor == 'function' && objCtor instanceof objCtor &&
            typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  var _equalObjects = equalObjects;

  /* Built-in method references that are verified to be native. */
  var DataView = _getNative(_root, 'DataView');

  var _DataView = DataView;

  /* Built-in method references that are verified to be native. */
  var Promise$1 = _getNative(_root, 'Promise');

  var _Promise = Promise$1;

  /* Built-in method references that are verified to be native. */
  var Set$1 = _getNative(_root, 'Set');

  var _Set = Set$1;

  /* Built-in method references that are verified to be native. */
  var WeakMap = _getNative(_root, 'WeakMap');

  var _WeakMap = WeakMap;

  /** `Object#toString` result references. */
  var mapTag$2 = '[object Map]',
      objectTag$1 = '[object Object]',
      promiseTag = '[object Promise]',
      setTag$2 = '[object Set]',
      weakMapTag$1 = '[object WeakMap]';

  var dataViewTag$2 = '[object DataView]';

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = _toSource(_DataView),
      mapCtorString = _toSource(_Map),
      promiseCtorString = _toSource(_Promise),
      setCtorString = _toSource(_Set),
      weakMapCtorString = _toSource(_WeakMap);

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = _baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if ((_DataView && getTag(new _DataView(new ArrayBuffer(1))) != dataViewTag$2) ||
      (_Map && getTag(new _Map) != mapTag$2) ||
      (_Promise && getTag(_Promise.resolve()) != promiseTag) ||
      (_Set && getTag(new _Set) != setTag$2) ||
      (_WeakMap && getTag(new _WeakMap) != weakMapTag$1)) {
    getTag = function(value) {
      var result = _baseGetTag(value),
          Ctor = result == objectTag$1 ? value.constructor : undefined,
          ctorString = Ctor ? _toSource(Ctor) : '';

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString: return dataViewTag$2;
          case mapCtorString: return mapTag$2;
          case promiseCtorString: return promiseTag;
          case setCtorString: return setTag$2;
          case weakMapCtorString: return weakMapTag$1;
        }
      }
      return result;
    };
  }

  var _getTag = getTag;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$3 = 1;

  /** `Object#toString` result references. */
  var argsTag$2 = '[object Arguments]',
      arrayTag$1 = '[object Array]',
      objectTag$2 = '[object Object]';

  /** Used for built-in method references. */
  var objectProto$b = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty$8 = objectProto$b.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
   * @param {Function} customizer The function to customize comparisons.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
    var objIsArr = isArray_1(object),
        othIsArr = isArray_1(other),
        objTag = objIsArr ? arrayTag$1 : _getTag(object),
        othTag = othIsArr ? arrayTag$1 : _getTag(other);

    objTag = objTag == argsTag$2 ? objectTag$2 : objTag;
    othTag = othTag == argsTag$2 ? objectTag$2 : othTag;

    var objIsObj = objTag == objectTag$2,
        othIsObj = othTag == objectTag$2,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer_1(object)) {
      if (!isBuffer_1(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new _Stack);
      return (objIsArr || isTypedArray_1(object))
        ? _equalArrays(object, other, bitmask, customizer, equalFunc, stack)
        : _equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
    }
    if (!(bitmask & COMPARE_PARTIAL_FLAG$3)) {
      var objIsWrapped = objIsObj && hasOwnProperty$8.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty$8.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new _Stack);
        return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new _Stack);
    return _equalObjects(object, other, bitmask, customizer, equalFunc, stack);
  }

  var _baseIsEqualDeep = baseIsEqualDeep;

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {boolean} bitmask The bitmask flags.
   *  1 - Unordered comparison
   *  2 - Partial comparison
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, bitmask, customizer, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || (!isObjectLike_1(value) && !isObjectLike_1(other))) {
      return value !== value && other !== other;
    }
    return _baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
  }

  var _baseIsEqual = baseIsEqual;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$4 = 1,
      COMPARE_UNORDERED_FLAG$2 = 2;

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if ((noCustomizer && data[2])
            ? data[1] !== object[data[0]]
            : !(data[0] in object)
          ) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0],
          objValue = object[key],
          srcValue = data[1];

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false;
        }
      } else {
        var stack = new _Stack;
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === undefined
              ? _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$4 | COMPARE_UNORDERED_FLAG$2, customizer, stack)
              : result
            )) {
          return false;
        }
      }
    }
    return true;
  }

  var _baseIsMatch = baseIsMatch;

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject_1(value);
  }

  var _isStrictComparable = isStrictComparable;

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
    var result = keys_1(object),
        length = result.length;

    while (length--) {
      var key = result[length],
          value = object[key];

      result[length] = [key, value, _isStrictComparable(value)];
    }
    return result;
  }

  var _getMatchData = getMatchData;

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function(object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue &&
        (srcValue !== undefined || (key in Object(object)));
    };
  }

  var _matchesStrictComparable = matchesStrictComparable;

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = _getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return _matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function(object) {
      return object === source || _baseIsMatch(object, source, matchData);
    };
  }

  var _baseMatches = baseMatches;

  /** `Object#toString` result references. */
  var symbolTag$1 = '[object Symbol]';

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return typeof value == 'symbol' ||
      (isObjectLike_1(value) && _baseGetTag(value) == symbolTag$1);
  }

  var isSymbol_1 = isSymbol;

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/;

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray_1(value)) {
      return false;
    }
    var type = typeof value;
    if (type == 'number' || type == 'symbol' || type == 'boolean' ||
        value == null || isSymbol_1(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
      (object != null && value in Object(object));
  }

  var _isKey = isKey;

  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `clear`, `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || (resolver != null && typeof resolver != 'function')) {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize.Cache || _MapCache);
    return memoized;
  }

  // Expose `MapCache`.
  memoize.Cache = _MapCache;

  var memoize_1 = memoize;

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize_1(func, function(key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });

    var cache = result.cache;
    return result;
  }

  var _memoizeCapped = memoizeCapped;

  /** Used to match property names within property paths. */
  var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = _memoizeCapped(function(string) {
    var result = [];
    if (string.charCodeAt(0) === 46 /* . */) {
      result.push('');
    }
    string.replace(rePropName, function(match, number, quote, subString) {
      result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match));
    });
    return result;
  });

  var _stringToPath = stringToPath;

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array == null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  var _arrayMap = arrayMap;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto$1 = _Symbol ? _Symbol.prototype : undefined,
      symbolToString = symbolProto$1 ? symbolProto$1.toString : undefined;

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray_1(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return _arrayMap(value, baseToString) + '';
    }
    if (isSymbol_1(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
  }

  var _baseToString = baseToString;

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : _baseToString(value);
  }

  var toString_1 = toString;

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @param {Object} [object] The object to query keys on.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value, object) {
    if (isArray_1(value)) {
      return value;
    }
    return _isKey(value, object) ? [value] : _stringToPath(toString_1(value));
  }

  var _castPath = castPath;

  /** Used as references for various `Number` constants. */
  var INFINITY$1 = 1 / 0;

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol_1(value)) {
      return value;
    }
    var result = (value + '');
    return (result == '0' && (1 / value) == -INFINITY$1) ? '-0' : result;
  }

  var _toKey = toKey;

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = _castPath(path, object);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[_toKey(path[index++])];
    }
    return (index && index == length) ? object : undefined;
  }

  var _baseGet = baseGet;

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get(object, path, defaultValue) {
    var result = object == null ? undefined : _baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }

  var get_1 = get;

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object);
  }

  var _baseHasIn = baseHasIn;

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = _castPath(path, object);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
      var key = _toKey(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result || ++index != length) {
      return result;
    }
    length = object == null ? 0 : object.length;
    return !!length && isLength_1(length) && _isIndex(key, length) &&
      (isArray_1(object) || isArguments_1(object));
  }

  var _hasPath = hasPath;

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && _hasPath(object, path, _baseHasIn);
  }

  var hasIn_1 = hasIn;

  /** Used to compose bitmasks for value comparisons. */
  var COMPARE_PARTIAL_FLAG$5 = 1,
      COMPARE_UNORDERED_FLAG$3 = 2;

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (_isKey(path) && _isStrictComparable(srcValue)) {
      return _matchesStrictComparable(_toKey(path), srcValue);
    }
    return function(object) {
      var objValue = get_1(object, path);
      return (objValue === undefined && objValue === srcValue)
        ? hasIn_1(object, path)
        : _baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG$5 | COMPARE_UNORDERED_FLAG$3);
    };
  }

  var _baseMatchesProperty = baseMatchesProperty;

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  var identity_1 = identity;

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function(object) {
      return object == null ? undefined : object[key];
    };
  }

  var _baseProperty = baseProperty;

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function(object) {
      return _baseGet(object, path);
    };
  }

  var _basePropertyDeep = basePropertyDeep;

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return _isKey(path) ? _baseProperty(_toKey(path)) : _basePropertyDeep(path);
  }

  var property_1 = property;

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value;
    }
    if (value == null) {
      return identity_1;
    }
    if (typeof value == 'object') {
      return isArray_1(value)
        ? _baseMatchesProperty(value[0], value[1])
        : _baseMatches(value);
    }
    return property_1(value);
  }

  var _baseIteratee = baseIteratee;

  /**
   * This method is like `_.find` except that it returns the key of the first
   * element `predicate` returns truthy for instead of the element itself.
   *
   * @static
   * @memberOf _
   * @since 1.1.0
   * @category Object
   * @param {Object} object The object to inspect.
   * @param {Function} [predicate=_.identity] The function invoked per iteration.
   * @returns {string|undefined} Returns the key of the matched element,
   *  else `undefined`.
   * @example
   *
   * var users = {
   *   'barney':  { 'age': 36, 'active': true },
   *   'fred':    { 'age': 40, 'active': false },
   *   'pebbles': { 'age': 1,  'active': true }
   * };
   *
   * _.findKey(users, function(o) { return o.age < 40; });
   * // => 'barney' (iteration order is not guaranteed)
   *
   * // The `_.matches` iteratee shorthand.
   * _.findKey(users, { 'age': 1, 'active': true });
   * // => 'pebbles'
   *
   * // The `_.matchesProperty` iteratee shorthand.
   * _.findKey(users, ['active', false]);
   * // => 'fred'
   *
   * // The `_.property` iteratee shorthand.
   * _.findKey(users, 'active');
   * // => 'barney'
   */
  function findKey(object, predicate) {
    return _baseFindKey(object, _baseIteratee(predicate, 3), _baseForOwn);
  }

  var findKey_1 = findKey;

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

  function findURLKey(object) {
    return findKey_1(object, (_, key) => matchesURL(key));
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

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isFunction$1(x) {
      return typeof x === 'function';
  }
  //# sourceMappingURL=isFunction.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var _enable_super_gross_mode_that_will_cause_bad_things = false;
  var config = {
      Promise: undefined,
      set useDeprecatedSynchronousErrorHandling(value) {
          if (value) {
              var error = /*@__PURE__*/ new Error();
              /*@__PURE__*/ console.warn('DEPRECATED! RxJS was set to use deprecated synchronous error handling behavior by code at: \n' + error.stack);
          }
          else if (_enable_super_gross_mode_that_will_cause_bad_things) {
              /*@__PURE__*/ console.log('RxJS: Back to a better error behavior. Thank you. <3');
          }
          _enable_super_gross_mode_that_will_cause_bad_things = value;
      },
      get useDeprecatedSynchronousErrorHandling() {
          return _enable_super_gross_mode_that_will_cause_bad_things;
      },
  };
  //# sourceMappingURL=config.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function hostReportError(err) {
      setTimeout(function () { throw err; });
  }
  //# sourceMappingURL=hostReportError.js.map

  /** PURE_IMPORTS_START _config,_util_hostReportError PURE_IMPORTS_END */
  var empty = {
      closed: true,
      next: function (value) { },
      error: function (err) {
          if (config.useDeprecatedSynchronousErrorHandling) {
              throw err;
          }
          else {
              hostReportError(err);
          }
      },
      complete: function () { }
  };
  //# sourceMappingURL=Observer.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var isArray$1 = Array.isArray || (function (x) { return x && typeof x.length === 'number'; });
  //# sourceMappingURL=isArray.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isObject$1(x) {
      return x != null && typeof x === 'object';
  }
  //# sourceMappingURL=isObject.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var errorObject = { e: {} };
  //# sourceMappingURL=errorObject.js.map

  /** PURE_IMPORTS_START _errorObject PURE_IMPORTS_END */
  var tryCatchTarget;
  function tryCatcher() {
      try {
          return tryCatchTarget.apply(this, arguments);
      }
      catch (e) {
          errorObject.e = e;
          return errorObject;
      }
  }
  function tryCatch(fn) {
      tryCatchTarget = fn;
      return tryCatcher;
  }
  //# sourceMappingURL=tryCatch.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function UnsubscriptionErrorImpl(errors) {
      Error.call(this);
      this.message = errors ?
          errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ') : '';
      this.name = 'UnsubscriptionError';
      this.errors = errors;
      return this;
  }
  UnsubscriptionErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
  var UnsubscriptionError = UnsubscriptionErrorImpl;
  //# sourceMappingURL=UnsubscriptionError.js.map

  /** PURE_IMPORTS_START _util_isArray,_util_isObject,_util_isFunction,_util_tryCatch,_util_errorObject,_util_UnsubscriptionError PURE_IMPORTS_END */
  var Subscription = /*@__PURE__*/ (function () {
      function Subscription(unsubscribe) {
          this.closed = false;
          this._parent = null;
          this._parents = null;
          this._subscriptions = null;
          if (unsubscribe) {
              this._unsubscribe = unsubscribe;
          }
      }
      Subscription.prototype.unsubscribe = function () {
          var hasErrors = false;
          var errors;
          if (this.closed) {
              return;
          }
          var _a = this, _parent = _a._parent, _parents = _a._parents, _unsubscribe = _a._unsubscribe, _subscriptions = _a._subscriptions;
          this.closed = true;
          this._parent = null;
          this._parents = null;
          this._subscriptions = null;
          var index = -1;
          var len = _parents ? _parents.length : 0;
          while (_parent) {
              _parent.remove(this);
              _parent = ++index < len && _parents[index] || null;
          }
          if (isFunction$1(_unsubscribe)) {
              var trial = tryCatch(_unsubscribe).call(this);
              if (trial === errorObject) {
                  hasErrors = true;
                  errors = errors || (errorObject.e instanceof UnsubscriptionError ?
                      flattenUnsubscriptionErrors(errorObject.e.errors) : [errorObject.e]);
              }
          }
          if (isArray$1(_subscriptions)) {
              index = -1;
              len = _subscriptions.length;
              while (++index < len) {
                  var sub = _subscriptions[index];
                  if (isObject$1(sub)) {
                      var trial = tryCatch(sub.unsubscribe).call(sub);
                      if (trial === errorObject) {
                          hasErrors = true;
                          errors = errors || [];
                          var err = errorObject.e;
                          if (err instanceof UnsubscriptionError) {
                              errors = errors.concat(flattenUnsubscriptionErrors(err.errors));
                          }
                          else {
                              errors.push(err);
                          }
                      }
                  }
              }
          }
          if (hasErrors) {
              throw new UnsubscriptionError(errors);
          }
      };
      Subscription.prototype.add = function (teardown) {
          if (!teardown || (teardown === Subscription.EMPTY)) {
              return Subscription.EMPTY;
          }
          if (teardown === this) {
              return this;
          }
          var subscription = teardown;
          switch (typeof teardown) {
              case 'function':
                  subscription = new Subscription(teardown);
              case 'object':
                  if (subscription.closed || typeof subscription.unsubscribe !== 'function') {
                      return subscription;
                  }
                  else if (this.closed) {
                      subscription.unsubscribe();
                      return subscription;
                  }
                  else if (typeof subscription._addParent !== 'function') {
                      var tmp = subscription;
                      subscription = new Subscription();
                      subscription._subscriptions = [tmp];
                  }
                  break;
              default:
                  throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.');
          }
          var subscriptions = this._subscriptions || (this._subscriptions = []);
          subscriptions.push(subscription);
          subscription._addParent(this);
          return subscription;
      };
      Subscription.prototype.remove = function (subscription) {
          var subscriptions = this._subscriptions;
          if (subscriptions) {
              var subscriptionIndex = subscriptions.indexOf(subscription);
              if (subscriptionIndex !== -1) {
                  subscriptions.splice(subscriptionIndex, 1);
              }
          }
      };
      Subscription.prototype._addParent = function (parent) {
          var _a = this, _parent = _a._parent, _parents = _a._parents;
          if (!_parent || _parent === parent) {
              this._parent = parent;
          }
          else if (!_parents) {
              this._parents = [parent];
          }
          else if (_parents.indexOf(parent) === -1) {
              _parents.push(parent);
          }
      };
      Subscription.EMPTY = (function (empty) {
          empty.closed = true;
          return empty;
      }(new Subscription()));
      return Subscription;
  }());
  function flattenUnsubscriptionErrors(errors) {
      return errors.reduce(function (errs, err) { return errs.concat((err instanceof UnsubscriptionError) ? err.errors : err); }, []);
  }
  //# sourceMappingURL=Subscription.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var rxSubscriber = typeof Symbol === 'function'
      ? /*@__PURE__*/ Symbol('rxSubscriber')
      : '@@rxSubscriber_' + /*@__PURE__*/ Math.random();
  //# sourceMappingURL=rxSubscriber.js.map

  /** PURE_IMPORTS_START tslib,_util_isFunction,_Observer,_Subscription,_internal_symbol_rxSubscriber,_config,_util_hostReportError PURE_IMPORTS_END */
  var Subscriber = /*@__PURE__*/ (function (_super) {
      __extends(Subscriber, _super);
      function Subscriber(destinationOrNext, error, complete) {
          var _this = _super.call(this) || this;
          _this.syncErrorValue = null;
          _this.syncErrorThrown = false;
          _this.syncErrorThrowable = false;
          _this.isStopped = false;
          _this._parentSubscription = null;
          switch (arguments.length) {
              case 0:
                  _this.destination = empty;
                  break;
              case 1:
                  if (!destinationOrNext) {
                      _this.destination = empty;
                      break;
                  }
                  if (typeof destinationOrNext === 'object') {
                      if (destinationOrNext instanceof Subscriber) {
                          _this.syncErrorThrowable = destinationOrNext.syncErrorThrowable;
                          _this.destination = destinationOrNext;
                          destinationOrNext.add(_this);
                      }
                      else {
                          _this.syncErrorThrowable = true;
                          _this.destination = new SafeSubscriber(_this, destinationOrNext);
                      }
                      break;
                  }
              default:
                  _this.syncErrorThrowable = true;
                  _this.destination = new SafeSubscriber(_this, destinationOrNext, error, complete);
                  break;
          }
          return _this;
      }
      Subscriber.prototype[rxSubscriber] = function () { return this; };
      Subscriber.create = function (next, error, complete) {
          var subscriber = new Subscriber(next, error, complete);
          subscriber.syncErrorThrowable = false;
          return subscriber;
      };
      Subscriber.prototype.next = function (value) {
          if (!this.isStopped) {
              this._next(value);
          }
      };
      Subscriber.prototype.error = function (err) {
          if (!this.isStopped) {
              this.isStopped = true;
              this._error(err);
          }
      };
      Subscriber.prototype.complete = function () {
          if (!this.isStopped) {
              this.isStopped = true;
              this._complete();
          }
      };
      Subscriber.prototype.unsubscribe = function () {
          if (this.closed) {
              return;
          }
          this.isStopped = true;
          _super.prototype.unsubscribe.call(this);
      };
      Subscriber.prototype._next = function (value) {
          this.destination.next(value);
      };
      Subscriber.prototype._error = function (err) {
          this.destination.error(err);
          this.unsubscribe();
      };
      Subscriber.prototype._complete = function () {
          this.destination.complete();
          this.unsubscribe();
      };
      Subscriber.prototype._unsubscribeAndRecycle = function () {
          var _a = this, _parent = _a._parent, _parents = _a._parents;
          this._parent = null;
          this._parents = null;
          this.unsubscribe();
          this.closed = false;
          this.isStopped = false;
          this._parent = _parent;
          this._parents = _parents;
          this._parentSubscription = null;
          return this;
      };
      return Subscriber;
  }(Subscription));
  var SafeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SafeSubscriber, _super);
      function SafeSubscriber(_parentSubscriber, observerOrNext, error, complete) {
          var _this = _super.call(this) || this;
          _this._parentSubscriber = _parentSubscriber;
          var next;
          var context = _this;
          if (isFunction$1(observerOrNext)) {
              next = observerOrNext;
          }
          else if (observerOrNext) {
              next = observerOrNext.next;
              error = observerOrNext.error;
              complete = observerOrNext.complete;
              if (observerOrNext !== empty) {
                  context = Object.create(observerOrNext);
                  if (isFunction$1(context.unsubscribe)) {
                      _this.add(context.unsubscribe.bind(context));
                  }
                  context.unsubscribe = _this.unsubscribe.bind(_this);
              }
          }
          _this._context = context;
          _this._next = next;
          _this._error = error;
          _this._complete = complete;
          return _this;
      }
      SafeSubscriber.prototype.next = function (value) {
          if (!this.isStopped && this._next) {
              var _parentSubscriber = this._parentSubscriber;
              if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                  this.__tryOrUnsub(this._next, value);
              }
              else if (this.__tryOrSetError(_parentSubscriber, this._next, value)) {
                  this.unsubscribe();
              }
          }
      };
      SafeSubscriber.prototype.error = function (err) {
          if (!this.isStopped) {
              var _parentSubscriber = this._parentSubscriber;
              var useDeprecatedSynchronousErrorHandling = config.useDeprecatedSynchronousErrorHandling;
              if (this._error) {
                  if (!useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                      this.__tryOrUnsub(this._error, err);
                      this.unsubscribe();
                  }
                  else {
                      this.__tryOrSetError(_parentSubscriber, this._error, err);
                      this.unsubscribe();
                  }
              }
              else if (!_parentSubscriber.syncErrorThrowable) {
                  this.unsubscribe();
                  if (useDeprecatedSynchronousErrorHandling) {
                      throw err;
                  }
                  hostReportError(err);
              }
              else {
                  if (useDeprecatedSynchronousErrorHandling) {
                      _parentSubscriber.syncErrorValue = err;
                      _parentSubscriber.syncErrorThrown = true;
                  }
                  else {
                      hostReportError(err);
                  }
                  this.unsubscribe();
              }
          }
      };
      SafeSubscriber.prototype.complete = function () {
          var _this = this;
          if (!this.isStopped) {
              var _parentSubscriber = this._parentSubscriber;
              if (this._complete) {
                  var wrappedComplete = function () { return _this._complete.call(_this._context); };
                  if (!config.useDeprecatedSynchronousErrorHandling || !_parentSubscriber.syncErrorThrowable) {
                      this.__tryOrUnsub(wrappedComplete);
                      this.unsubscribe();
                  }
                  else {
                      this.__tryOrSetError(_parentSubscriber, wrappedComplete);
                      this.unsubscribe();
                  }
              }
              else {
                  this.unsubscribe();
              }
          }
      };
      SafeSubscriber.prototype.__tryOrUnsub = function (fn, value) {
          try {
              fn.call(this._context, value);
          }
          catch (err) {
              this.unsubscribe();
              if (config.useDeprecatedSynchronousErrorHandling) {
                  throw err;
              }
              else {
                  hostReportError(err);
              }
          }
      };
      SafeSubscriber.prototype.__tryOrSetError = function (parent, fn, value) {
          if (!config.useDeprecatedSynchronousErrorHandling) {
              throw new Error('bad call');
          }
          try {
              fn.call(this._context, value);
          }
          catch (err) {
              if (config.useDeprecatedSynchronousErrorHandling) {
                  parent.syncErrorValue = err;
                  parent.syncErrorThrown = true;
                  return true;
              }
              else {
                  hostReportError(err);
                  return true;
              }
          }
          return false;
      };
      SafeSubscriber.prototype._unsubscribe = function () {
          var _parentSubscriber = this._parentSubscriber;
          this._context = null;
          this._parentSubscriber = null;
          _parentSubscriber.unsubscribe();
      };
      return SafeSubscriber;
  }(Subscriber));
  //# sourceMappingURL=Subscriber.js.map

  /** PURE_IMPORTS_START _Subscriber PURE_IMPORTS_END */
  function canReportError(observer) {
      while (observer) {
          var _a = observer, closed_1 = _a.closed, destination = _a.destination, isStopped = _a.isStopped;
          if (closed_1 || isStopped) {
              return false;
          }
          else if (destination && destination instanceof Subscriber) {
              observer = destination;
          }
          else {
              observer = null;
          }
      }
      return true;
  }
  //# sourceMappingURL=canReportError.js.map

  /** PURE_IMPORTS_START _Subscriber,_symbol_rxSubscriber,_Observer PURE_IMPORTS_END */
  function toSubscriber(nextOrObserver, error, complete) {
      if (nextOrObserver) {
          if (nextOrObserver instanceof Subscriber) {
              return nextOrObserver;
          }
          if (nextOrObserver[rxSubscriber]) {
              return nextOrObserver[rxSubscriber]();
          }
      }
      if (!nextOrObserver && !error && !complete) {
          return new Subscriber(empty);
      }
      return new Subscriber(nextOrObserver, error, complete);
  }
  //# sourceMappingURL=toSubscriber.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var observable = typeof Symbol === 'function' && Symbol.observable || '@@observable';
  //# sourceMappingURL=observable.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function noop() { }
  //# sourceMappingURL=noop.js.map

  /** PURE_IMPORTS_START _noop PURE_IMPORTS_END */
  function pipeFromArray(fns) {
      if (!fns) {
          return noop;
      }
      if (fns.length === 1) {
          return fns[0];
      }
      return function piped(input) {
          return fns.reduce(function (prev, fn) { return fn(prev); }, input);
      };
  }
  //# sourceMappingURL=pipe.js.map

  /** PURE_IMPORTS_START _util_canReportError,_util_toSubscriber,_internal_symbol_observable,_util_pipe,_config PURE_IMPORTS_END */
  var Observable = /*@__PURE__*/ (function () {
      function Observable(subscribe) {
          this._isScalar = false;
          if (subscribe) {
              this._subscribe = subscribe;
          }
      }
      Observable.prototype.lift = function (operator) {
          var observable$$1 = new Observable();
          observable$$1.source = this;
          observable$$1.operator = operator;
          return observable$$1;
      };
      Observable.prototype.subscribe = function (observerOrNext, error, complete) {
          var operator = this.operator;
          var sink = toSubscriber(observerOrNext, error, complete);
          if (operator) {
              operator.call(sink, this.source);
          }
          else {
              sink.add(this.source || (config.useDeprecatedSynchronousErrorHandling && !sink.syncErrorThrowable) ?
                  this._subscribe(sink) :
                  this._trySubscribe(sink));
          }
          if (config.useDeprecatedSynchronousErrorHandling) {
              if (sink.syncErrorThrowable) {
                  sink.syncErrorThrowable = false;
                  if (sink.syncErrorThrown) {
                      throw sink.syncErrorValue;
                  }
              }
          }
          return sink;
      };
      Observable.prototype._trySubscribe = function (sink) {
          try {
              return this._subscribe(sink);
          }
          catch (err) {
              if (config.useDeprecatedSynchronousErrorHandling) {
                  sink.syncErrorThrown = true;
                  sink.syncErrorValue = err;
              }
              if (canReportError(sink)) {
                  sink.error(err);
              }
              else {
                  console.warn(err);
              }
          }
      };
      Observable.prototype.forEach = function (next, promiseCtor) {
          var _this = this;
          promiseCtor = getPromiseCtor(promiseCtor);
          return new promiseCtor(function (resolve, reject) {
              var subscription;
              subscription = _this.subscribe(function (value) {
                  try {
                      next(value);
                  }
                  catch (err) {
                      reject(err);
                      if (subscription) {
                          subscription.unsubscribe();
                      }
                  }
              }, reject, resolve);
          });
      };
      Observable.prototype._subscribe = function (subscriber) {
          var source = this.source;
          return source && source.subscribe(subscriber);
      };
      Observable.prototype[observable] = function () {
          return this;
      };
      Observable.prototype.pipe = function () {
          var operations = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              operations[_i] = arguments[_i];
          }
          if (operations.length === 0) {
              return this;
          }
          return pipeFromArray(operations)(this);
      };
      Observable.prototype.toPromise = function (promiseCtor) {
          var _this = this;
          promiseCtor = getPromiseCtor(promiseCtor);
          return new promiseCtor(function (resolve, reject) {
              var value;
              _this.subscribe(function (x) { return value = x; }, function (err) { return reject(err); }, function () { return resolve(value); });
          });
      };
      Observable.create = function (subscribe) {
          return new Observable(subscribe);
      };
      return Observable;
  }());
  function getPromiseCtor(promiseCtor) {
      if (!promiseCtor) {
          promiseCtor = config.Promise || Promise;
      }
      if (!promiseCtor) {
          throw new Error('no Promise impl found');
      }
      return promiseCtor;
  }
  //# sourceMappingURL=Observable.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function ObjectUnsubscribedErrorImpl() {
      Error.call(this);
      this.message = 'object unsubscribed';
      this.name = 'ObjectUnsubscribedError';
      return this;
  }
  ObjectUnsubscribedErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
  var ObjectUnsubscribedError = ObjectUnsubscribedErrorImpl;
  //# sourceMappingURL=ObjectUnsubscribedError.js.map

  /** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */
  var SubjectSubscription = /*@__PURE__*/ (function (_super) {
      __extends(SubjectSubscription, _super);
      function SubjectSubscription(subject, subscriber) {
          var _this = _super.call(this) || this;
          _this.subject = subject;
          _this.subscriber = subscriber;
          _this.closed = false;
          return _this;
      }
      SubjectSubscription.prototype.unsubscribe = function () {
          if (this.closed) {
              return;
          }
          this.closed = true;
          var subject = this.subject;
          var observers = subject.observers;
          this.subject = null;
          if (!observers || observers.length === 0 || subject.isStopped || subject.closed) {
              return;
          }
          var subscriberIndex = observers.indexOf(this.subscriber);
          if (subscriberIndex !== -1) {
              observers.splice(subscriberIndex, 1);
          }
      };
      return SubjectSubscription;
  }(Subscription));
  //# sourceMappingURL=SubjectSubscription.js.map

  /** PURE_IMPORTS_START tslib,_Observable,_Subscriber,_Subscription,_util_ObjectUnsubscribedError,_SubjectSubscription,_internal_symbol_rxSubscriber PURE_IMPORTS_END */
  var SubjectSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SubjectSubscriber, _super);
      function SubjectSubscriber(destination) {
          var _this = _super.call(this, destination) || this;
          _this.destination = destination;
          return _this;
      }
      return SubjectSubscriber;
  }(Subscriber));
  var Subject = /*@__PURE__*/ (function (_super) {
      __extends(Subject, _super);
      function Subject() {
          var _this = _super.call(this) || this;
          _this.observers = [];
          _this.closed = false;
          _this.isStopped = false;
          _this.hasError = false;
          _this.thrownError = null;
          return _this;
      }
      Subject.prototype[rxSubscriber] = function () {
          return new SubjectSubscriber(this);
      };
      Subject.prototype.lift = function (operator) {
          var subject = new AnonymousSubject(this, this);
          subject.operator = operator;
          return subject;
      };
      Subject.prototype.next = function (value) {
          if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          if (!this.isStopped) {
              var observers = this.observers;
              var len = observers.length;
              var copy = observers.slice();
              for (var i = 0; i < len; i++) {
                  copy[i].next(value);
              }
          }
      };
      Subject.prototype.error = function (err) {
          if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          this.hasError = true;
          this.thrownError = err;
          this.isStopped = true;
          var observers = this.observers;
          var len = observers.length;
          var copy = observers.slice();
          for (var i = 0; i < len; i++) {
              copy[i].error(err);
          }
          this.observers.length = 0;
      };
      Subject.prototype.complete = function () {
          if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          this.isStopped = true;
          var observers = this.observers;
          var len = observers.length;
          var copy = observers.slice();
          for (var i = 0; i < len; i++) {
              copy[i].complete();
          }
          this.observers.length = 0;
      };
      Subject.prototype.unsubscribe = function () {
          this.isStopped = true;
          this.closed = true;
          this.observers = null;
      };
      Subject.prototype._trySubscribe = function (subscriber) {
          if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          else {
              return _super.prototype._trySubscribe.call(this, subscriber);
          }
      };
      Subject.prototype._subscribe = function (subscriber) {
          if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          else if (this.hasError) {
              subscriber.error(this.thrownError);
              return Subscription.EMPTY;
          }
          else if (this.isStopped) {
              subscriber.complete();
              return Subscription.EMPTY;
          }
          else {
              this.observers.push(subscriber);
              return new SubjectSubscription(this, subscriber);
          }
      };
      Subject.prototype.asObservable = function () {
          var observable = new Observable();
          observable.source = this;
          return observable;
      };
      Subject.create = function (destination, source) {
          return new AnonymousSubject(destination, source);
      };
      return Subject;
  }(Observable));
  var AnonymousSubject = /*@__PURE__*/ (function (_super) {
      __extends(AnonymousSubject, _super);
      function AnonymousSubject(destination, source) {
          var _this = _super.call(this) || this;
          _this.destination = destination;
          _this.source = source;
          return _this;
      }
      AnonymousSubject.prototype.next = function (value) {
          var destination = this.destination;
          if (destination && destination.next) {
              destination.next(value);
          }
      };
      AnonymousSubject.prototype.error = function (err) {
          var destination = this.destination;
          if (destination && destination.error) {
              this.destination.error(err);
          }
      };
      AnonymousSubject.prototype.complete = function () {
          var destination = this.destination;
          if (destination && destination.complete) {
              this.destination.complete();
          }
      };
      AnonymousSubject.prototype._subscribe = function (subscriber) {
          var source = this.source;
          if (source) {
              return this.source.subscribe(subscriber);
          }
          else {
              return Subscription.EMPTY;
          }
      };
      return AnonymousSubject;
  }(Subject));
  //# sourceMappingURL=Subject.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  function refCount() {
      return function refCountOperatorFunction(source) {
          return source.lift(new RefCountOperator(source));
      };
  }
  var RefCountOperator = /*@__PURE__*/ (function () {
      function RefCountOperator(connectable) {
          this.connectable = connectable;
      }
      RefCountOperator.prototype.call = function (subscriber, source) {
          var connectable = this.connectable;
          connectable._refCount++;
          var refCounter = new RefCountSubscriber(subscriber, connectable);
          var subscription = source.subscribe(refCounter);
          if (!refCounter.closed) {
              refCounter.connection = connectable.connect();
          }
          return subscription;
      };
      return RefCountOperator;
  }());
  var RefCountSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(RefCountSubscriber, _super);
      function RefCountSubscriber(destination, connectable) {
          var _this = _super.call(this, destination) || this;
          _this.connectable = connectable;
          return _this;
      }
      RefCountSubscriber.prototype._unsubscribe = function () {
          var connectable = this.connectable;
          if (!connectable) {
              this.connection = null;
              return;
          }
          this.connectable = null;
          var refCount = connectable._refCount;
          if (refCount <= 0) {
              this.connection = null;
              return;
          }
          connectable._refCount = refCount - 1;
          if (refCount > 1) {
              this.connection = null;
              return;
          }
          var connection = this.connection;
          var sharedConnection = connectable._connection;
          this.connection = null;
          if (sharedConnection && (!connection || sharedConnection === connection)) {
              sharedConnection.unsubscribe();
          }
      };
      return RefCountSubscriber;
  }(Subscriber));
  //# sourceMappingURL=refCount.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_Observable,_Subscriber,_Subscription,_operators_refCount PURE_IMPORTS_END */
  var ConnectableObservable = /*@__PURE__*/ (function (_super) {
      __extends(ConnectableObservable, _super);
      function ConnectableObservable(source, subjectFactory) {
          var _this = _super.call(this) || this;
          _this.source = source;
          _this.subjectFactory = subjectFactory;
          _this._refCount = 0;
          _this._isComplete = false;
          return _this;
      }
      ConnectableObservable.prototype._subscribe = function (subscriber) {
          return this.getSubject().subscribe(subscriber);
      };
      ConnectableObservable.prototype.getSubject = function () {
          var subject = this._subject;
          if (!subject || subject.isStopped) {
              this._subject = this.subjectFactory();
          }
          return this._subject;
      };
      ConnectableObservable.prototype.connect = function () {
          var connection = this._connection;
          if (!connection) {
              this._isComplete = false;
              connection = this._connection = new Subscription();
              connection.add(this.source
                  .subscribe(new ConnectableSubscriber(this.getSubject(), this)));
              if (connection.closed) {
                  this._connection = null;
                  connection = Subscription.EMPTY;
              }
              else {
                  this._connection = connection;
              }
          }
          return connection;
      };
      ConnectableObservable.prototype.refCount = function () {
          return refCount()(this);
      };
      return ConnectableObservable;
  }(Observable));
  var connectableProto = ConnectableObservable.prototype;
  var connectableObservableDescriptor = {
      operator: { value: null },
      _refCount: { value: 0, writable: true },
      _subject: { value: null, writable: true },
      _connection: { value: null, writable: true },
      _subscribe: { value: connectableProto._subscribe },
      _isComplete: { value: connectableProto._isComplete, writable: true },
      getSubject: { value: connectableProto.getSubject },
      connect: { value: connectableProto.connect },
      refCount: { value: connectableProto.refCount }
  };
  var ConnectableSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ConnectableSubscriber, _super);
      function ConnectableSubscriber(destination, connectable) {
          var _this = _super.call(this, destination) || this;
          _this.connectable = connectable;
          return _this;
      }
      ConnectableSubscriber.prototype._error = function (err) {
          this._unsubscribe();
          _super.prototype._error.call(this, err);
      };
      ConnectableSubscriber.prototype._complete = function () {
          this.connectable._isComplete = true;
          this._unsubscribe();
          _super.prototype._complete.call(this);
      };
      ConnectableSubscriber.prototype._unsubscribe = function () {
          var connectable = this.connectable;
          if (connectable) {
              this.connectable = null;
              var connection = connectable._connection;
              connectable._refCount = 0;
              connectable._subject = null;
              connectable._connection = null;
              if (connection) {
                  connection.unsubscribe();
              }
          }
      };
      return ConnectableSubscriber;
  }(SubjectSubscriber));
  var RefCountSubscriber$1 = /*@__PURE__*/ (function (_super) {
      __extends(RefCountSubscriber, _super);
      function RefCountSubscriber(destination, connectable) {
          var _this = _super.call(this, destination) || this;
          _this.connectable = connectable;
          return _this;
      }
      RefCountSubscriber.prototype._unsubscribe = function () {
          var connectable = this.connectable;
          if (!connectable) {
              this.connection = null;
              return;
          }
          this.connectable = null;
          var refCount$$1 = connectable._refCount;
          if (refCount$$1 <= 0) {
              this.connection = null;
              return;
          }
          connectable._refCount = refCount$$1 - 1;
          if (refCount$$1 > 1) {
              this.connection = null;
              return;
          }
          var connection = this.connection;
          var sharedConnection = connectable._connection;
          this.connection = null;
          if (sharedConnection && (!connection || sharedConnection === connection)) {
              sharedConnection.unsubscribe();
          }
      };
      return RefCountSubscriber;
  }(Subscriber));
  //# sourceMappingURL=ConnectableObservable.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_Subscription,_Observable,_Subject PURE_IMPORTS_END */
  var GroupBySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(GroupBySubscriber, _super);
      function GroupBySubscriber(destination, keySelector, elementSelector, durationSelector, subjectSelector) {
          var _this = _super.call(this, destination) || this;
          _this.keySelector = keySelector;
          _this.elementSelector = elementSelector;
          _this.durationSelector = durationSelector;
          _this.subjectSelector = subjectSelector;
          _this.groups = null;
          _this.attemptedToUnsubscribe = false;
          _this.count = 0;
          return _this;
      }
      GroupBySubscriber.prototype._next = function (value) {
          var key;
          try {
              key = this.keySelector(value);
          }
          catch (err) {
              this.error(err);
              return;
          }
          this._group(value, key);
      };
      GroupBySubscriber.prototype._group = function (value, key) {
          var groups = this.groups;
          if (!groups) {
              groups = this.groups = new Map();
          }
          var group = groups.get(key);
          var element;
          if (this.elementSelector) {
              try {
                  element = this.elementSelector(value);
              }
              catch (err) {
                  this.error(err);
              }
          }
          else {
              element = value;
          }
          if (!group) {
              group = (this.subjectSelector ? this.subjectSelector() : new Subject());
              groups.set(key, group);
              var groupedObservable = new GroupedObservable(key, group, this);
              this.destination.next(groupedObservable);
              if (this.durationSelector) {
                  var duration = void 0;
                  try {
                      duration = this.durationSelector(new GroupedObservable(key, group));
                  }
                  catch (err) {
                      this.error(err);
                      return;
                  }
                  this.add(duration.subscribe(new GroupDurationSubscriber(key, group, this)));
              }
          }
          if (!group.closed) {
              group.next(element);
          }
      };
      GroupBySubscriber.prototype._error = function (err) {
          var groups = this.groups;
          if (groups) {
              groups.forEach(function (group, key) {
                  group.error(err);
              });
              groups.clear();
          }
          this.destination.error(err);
      };
      GroupBySubscriber.prototype._complete = function () {
          var groups = this.groups;
          if (groups) {
              groups.forEach(function (group, key) {
                  group.complete();
              });
              groups.clear();
          }
          this.destination.complete();
      };
      GroupBySubscriber.prototype.removeGroup = function (key) {
          this.groups.delete(key);
      };
      GroupBySubscriber.prototype.unsubscribe = function () {
          if (!this.closed) {
              this.attemptedToUnsubscribe = true;
              if (this.count === 0) {
                  _super.prototype.unsubscribe.call(this);
              }
          }
      };
      return GroupBySubscriber;
  }(Subscriber));
  var GroupDurationSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(GroupDurationSubscriber, _super);
      function GroupDurationSubscriber(key, group, parent) {
          var _this = _super.call(this, group) || this;
          _this.key = key;
          _this.group = group;
          _this.parent = parent;
          return _this;
      }
      GroupDurationSubscriber.prototype._next = function (value) {
          this.complete();
      };
      GroupDurationSubscriber.prototype._unsubscribe = function () {
          var _a = this, parent = _a.parent, key = _a.key;
          this.key = this.parent = null;
          if (parent) {
              parent.removeGroup(key);
          }
      };
      return GroupDurationSubscriber;
  }(Subscriber));
  var GroupedObservable = /*@__PURE__*/ (function (_super) {
      __extends(GroupedObservable, _super);
      function GroupedObservable(key, groupSubject, refCountSubscription) {
          var _this = _super.call(this) || this;
          _this.key = key;
          _this.groupSubject = groupSubject;
          _this.refCountSubscription = refCountSubscription;
          return _this;
      }
      GroupedObservable.prototype._subscribe = function (subscriber) {
          var subscription = new Subscription();
          var _a = this, refCountSubscription = _a.refCountSubscription, groupSubject = _a.groupSubject;
          if (refCountSubscription && !refCountSubscription.closed) {
              subscription.add(new InnerRefCountSubscription(refCountSubscription));
          }
          subscription.add(groupSubject.subscribe(subscriber));
          return subscription;
      };
      return GroupedObservable;
  }(Observable));
  var InnerRefCountSubscription = /*@__PURE__*/ (function (_super) {
      __extends(InnerRefCountSubscription, _super);
      function InnerRefCountSubscription(parent) {
          var _this = _super.call(this) || this;
          _this.parent = parent;
          parent.count++;
          return _this;
      }
      InnerRefCountSubscription.prototype.unsubscribe = function () {
          var parent = this.parent;
          if (!parent.closed && !this.closed) {
              _super.prototype.unsubscribe.call(this);
              parent.count -= 1;
              if (parent.count === 0 && parent.attemptedToUnsubscribe) {
                  parent.unsubscribe();
              }
          }
      };
      return InnerRefCountSubscription;
  }(Subscription));
  //# sourceMappingURL=groupBy.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_util_ObjectUnsubscribedError PURE_IMPORTS_END */
  var BehaviorSubject = /*@__PURE__*/ (function (_super) {
      __extends(BehaviorSubject, _super);
      function BehaviorSubject(_value) {
          var _this = _super.call(this) || this;
          _this._value = _value;
          return _this;
      }
      Object.defineProperty(BehaviorSubject.prototype, "value", {
          get: function () {
              return this.getValue();
          },
          enumerable: true,
          configurable: true
      });
      BehaviorSubject.prototype._subscribe = function (subscriber) {
          var subscription = _super.prototype._subscribe.call(this, subscriber);
          if (subscription && !subscription.closed) {
              subscriber.next(this._value);
          }
          return subscription;
      };
      BehaviorSubject.prototype.getValue = function () {
          if (this.hasError) {
              throw this.thrownError;
          }
          else if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          else {
              return this._value;
          }
      };
      BehaviorSubject.prototype.next = function (value) {
          _super.prototype.next.call(this, this._value = value);
      };
      return BehaviorSubject;
  }(Subject));
  //# sourceMappingURL=BehaviorSubject.js.map

  /** PURE_IMPORTS_START tslib,_Subscription PURE_IMPORTS_END */
  var Action = /*@__PURE__*/ (function (_super) {
      __extends(Action, _super);
      function Action(scheduler, work) {
          return _super.call(this) || this;
      }
      Action.prototype.schedule = function (state, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          return this;
      };
      return Action;
  }(Subscription));
  //# sourceMappingURL=Action.js.map

  /** PURE_IMPORTS_START tslib,_Action PURE_IMPORTS_END */
  var AsyncAction = /*@__PURE__*/ (function (_super) {
      __extends(AsyncAction, _super);
      function AsyncAction(scheduler, work) {
          var _this = _super.call(this, scheduler, work) || this;
          _this.scheduler = scheduler;
          _this.work = work;
          _this.pending = false;
          return _this;
      }
      AsyncAction.prototype.schedule = function (state, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if (this.closed) {
              return this;
          }
          this.state = state;
          var id = this.id;
          var scheduler = this.scheduler;
          if (id != null) {
              this.id = this.recycleAsyncId(scheduler, id, delay);
          }
          this.pending = true;
          this.delay = delay;
          this.id = this.id || this.requestAsyncId(scheduler, this.id, delay);
          return this;
      };
      AsyncAction.prototype.requestAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          return setInterval(scheduler.flush.bind(scheduler, this), delay);
      };
      AsyncAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if (delay !== null && this.delay === delay && this.pending === false) {
              return id;
          }
          clearInterval(id);
      };
      AsyncAction.prototype.execute = function (state, delay) {
          if (this.closed) {
              return new Error('executing a cancelled action');
          }
          this.pending = false;
          var error = this._execute(state, delay);
          if (error) {
              return error;
          }
          else if (this.pending === false && this.id != null) {
              this.id = this.recycleAsyncId(this.scheduler, this.id, null);
          }
      };
      AsyncAction.prototype._execute = function (state, delay) {
          var errored = false;
          var errorValue = undefined;
          try {
              this.work(state);
          }
          catch (e) {
              errored = true;
              errorValue = !!e && e || new Error(e);
          }
          if (errored) {
              this.unsubscribe();
              return errorValue;
          }
      };
      AsyncAction.prototype._unsubscribe = function () {
          var id = this.id;
          var scheduler = this.scheduler;
          var actions = scheduler.actions;
          var index = actions.indexOf(this);
          this.work = null;
          this.state = null;
          this.pending = false;
          this.scheduler = null;
          if (index !== -1) {
              actions.splice(index, 1);
          }
          if (id != null) {
              this.id = this.recycleAsyncId(scheduler, id, null);
          }
          this.delay = null;
      };
      return AsyncAction;
  }(Action));
  //# sourceMappingURL=AsyncAction.js.map

  /** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */
  var QueueAction = /*@__PURE__*/ (function (_super) {
      __extends(QueueAction, _super);
      function QueueAction(scheduler, work) {
          var _this = _super.call(this, scheduler, work) || this;
          _this.scheduler = scheduler;
          _this.work = work;
          return _this;
      }
      QueueAction.prototype.schedule = function (state, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if (delay > 0) {
              return _super.prototype.schedule.call(this, state, delay);
          }
          this.delay = delay;
          this.state = state;
          this.scheduler.flush(this);
          return this;
      };
      QueueAction.prototype.execute = function (state, delay) {
          return (delay > 0 || this.closed) ?
              _super.prototype.execute.call(this, state, delay) :
              this._execute(state, delay);
      };
      QueueAction.prototype.requestAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
              return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
          }
          return scheduler.flush(this);
      };
      return QueueAction;
  }(AsyncAction));
  //# sourceMappingURL=QueueAction.js.map

  var Scheduler = /*@__PURE__*/ (function () {
      function Scheduler(SchedulerAction, now) {
          if (now === void 0) {
              now = Scheduler.now;
          }
          this.SchedulerAction = SchedulerAction;
          this.now = now;
      }
      Scheduler.prototype.schedule = function (work, delay, state) {
          if (delay === void 0) {
              delay = 0;
          }
          return new this.SchedulerAction(this, work).schedule(state, delay);
      };
      Scheduler.now = function () { return Date.now(); };
      return Scheduler;
  }());
  //# sourceMappingURL=Scheduler.js.map

  /** PURE_IMPORTS_START tslib,_Scheduler PURE_IMPORTS_END */
  var AsyncScheduler = /*@__PURE__*/ (function (_super) {
      __extends(AsyncScheduler, _super);
      function AsyncScheduler(SchedulerAction, now) {
          if (now === void 0) {
              now = Scheduler.now;
          }
          var _this = _super.call(this, SchedulerAction, function () {
              if (AsyncScheduler.delegate && AsyncScheduler.delegate !== _this) {
                  return AsyncScheduler.delegate.now();
              }
              else {
                  return now();
              }
          }) || this;
          _this.actions = [];
          _this.active = false;
          _this.scheduled = undefined;
          return _this;
      }
      AsyncScheduler.prototype.schedule = function (work, delay, state) {
          if (delay === void 0) {
              delay = 0;
          }
          if (AsyncScheduler.delegate && AsyncScheduler.delegate !== this) {
              return AsyncScheduler.delegate.schedule(work, delay, state);
          }
          else {
              return _super.prototype.schedule.call(this, work, delay, state);
          }
      };
      AsyncScheduler.prototype.flush = function (action) {
          var actions = this.actions;
          if (this.active) {
              actions.push(action);
              return;
          }
          var error;
          this.active = true;
          do {
              if (error = action.execute(action.state, action.delay)) {
                  break;
              }
          } while (action = actions.shift());
          this.active = false;
          if (error) {
              while (action = actions.shift()) {
                  action.unsubscribe();
              }
              throw error;
          }
      };
      return AsyncScheduler;
  }(Scheduler));
  //# sourceMappingURL=AsyncScheduler.js.map

  /** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */
  var QueueScheduler = /*@__PURE__*/ (function (_super) {
      __extends(QueueScheduler, _super);
      function QueueScheduler() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      return QueueScheduler;
  }(AsyncScheduler));
  //# sourceMappingURL=QueueScheduler.js.map

  /** PURE_IMPORTS_START _QueueAction,_QueueScheduler PURE_IMPORTS_END */
  var queue = /*@__PURE__*/ new QueueScheduler(QueueAction);
  //# sourceMappingURL=queue.js.map

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  var EMPTY = /*@__PURE__*/ new Observable(function (subscriber) { return subscriber.complete(); });
  function empty$1(scheduler) {
      return scheduler ? emptyScheduled(scheduler) : EMPTY;
  }
  function emptyScheduled(scheduler) {
      return new Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
  }
  //# sourceMappingURL=empty.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isScheduler(value) {
      return value && typeof value.schedule === 'function';
  }
  //# sourceMappingURL=isScheduler.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var subscribeToArray = function (array) {
      return function (subscriber) {
          for (var i = 0, len = array.length; i < len && !subscriber.closed; i++) {
              subscriber.next(array[i]);
          }
          if (!subscriber.closed) {
              subscriber.complete();
          }
      };
  };
  //# sourceMappingURL=subscribeToArray.js.map

  /** PURE_IMPORTS_START _Observable,_Subscription,_util_subscribeToArray PURE_IMPORTS_END */
  function fromArray(input, scheduler) {
      if (!scheduler) {
          return new Observable(subscribeToArray(input));
      }
      else {
          return new Observable(function (subscriber) {
              var sub = new Subscription();
              var i = 0;
              sub.add(scheduler.schedule(function () {
                  if (i === input.length) {
                      subscriber.complete();
                      return;
                  }
                  subscriber.next(input[i++]);
                  if (!subscriber.closed) {
                      sub.add(this.schedule());
                  }
              }));
              return sub;
          });
      }
  }
  //# sourceMappingURL=fromArray.js.map

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  function scalar(value) {
      var result = new Observable(function (subscriber) {
          subscriber.next(value);
          subscriber.complete();
      });
      result._isScalar = true;
      result.value = value;
      return result;
  }
  //# sourceMappingURL=scalar.js.map

  /** PURE_IMPORTS_START _util_isScheduler,_fromArray,_empty,_scalar PURE_IMPORTS_END */
  function of() {
      var args = [];
      for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
      }
      var scheduler = args[args.length - 1];
      if (isScheduler(scheduler)) {
          args.pop();
      }
      else {
          scheduler = undefined;
      }
      switch (args.length) {
          case 0:
              return empty$1(scheduler);
          case 1:
              return scheduler ? fromArray(args, scheduler) : scalar(args[0]);
          default:
              return fromArray(args, scheduler);
      }
  }
  //# sourceMappingURL=of.js.map

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  function throwError(error, scheduler) {
      if (!scheduler) {
          return new Observable(function (subscriber) { return subscriber.error(error); });
      }
      else {
          return new Observable(function (subscriber) { return scheduler.schedule(dispatch, 0, { error: error, subscriber: subscriber }); });
      }
  }
  function dispatch(_a) {
      var error = _a.error, subscriber = _a.subscriber;
      subscriber.error(error);
  }
  //# sourceMappingURL=throwError.js.map

  /** PURE_IMPORTS_START _observable_empty,_observable_of,_observable_throwError PURE_IMPORTS_END */
  var Notification = /*@__PURE__*/ (function () {
      function Notification(kind, value, error) {
          this.kind = kind;
          this.value = value;
          this.error = error;
          this.hasValue = kind === 'N';
      }
      Notification.prototype.observe = function (observer) {
          switch (this.kind) {
              case 'N':
                  return observer.next && observer.next(this.value);
              case 'E':
                  return observer.error && observer.error(this.error);
              case 'C':
                  return observer.complete && observer.complete();
          }
      };
      Notification.prototype.do = function (next, error, complete) {
          var kind = this.kind;
          switch (kind) {
              case 'N':
                  return next && next(this.value);
              case 'E':
                  return error && error(this.error);
              case 'C':
                  return complete && complete();
          }
      };
      Notification.prototype.accept = function (nextOrObserver, error, complete) {
          if (nextOrObserver && typeof nextOrObserver.next === 'function') {
              return this.observe(nextOrObserver);
          }
          else {
              return this.do(nextOrObserver, error, complete);
          }
      };
      Notification.prototype.toObservable = function () {
          var kind = this.kind;
          switch (kind) {
              case 'N':
                  return of(this.value);
              case 'E':
                  return throwError(this.error);
              case 'C':
                  return empty$1();
          }
          throw new Error('unexpected notification kind value');
      };
      Notification.createNext = function (value) {
          if (typeof value !== 'undefined') {
              return new Notification('N', value);
          }
          return Notification.undefinedValueNotification;
      };
      Notification.createError = function (err) {
          return new Notification('E', undefined, err);
      };
      Notification.createComplete = function () {
          return Notification.completeNotification;
      };
      Notification.completeNotification = new Notification('C');
      Notification.undefinedValueNotification = new Notification('N', undefined);
      return Notification;
  }());
  //# sourceMappingURL=Notification.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */
  var ObserveOnSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ObserveOnSubscriber, _super);
      function ObserveOnSubscriber(destination, scheduler, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          var _this = _super.call(this, destination) || this;
          _this.scheduler = scheduler;
          _this.delay = delay;
          return _this;
      }
      ObserveOnSubscriber.dispatch = function (arg) {
          var notification = arg.notification, destination = arg.destination;
          notification.observe(destination);
          this.unsubscribe();
      };
      ObserveOnSubscriber.prototype.scheduleMessage = function (notification) {
          var destination = this.destination;
          destination.add(this.scheduler.schedule(ObserveOnSubscriber.dispatch, this.delay, new ObserveOnMessage(notification, this.destination)));
      };
      ObserveOnSubscriber.prototype._next = function (value) {
          this.scheduleMessage(Notification.createNext(value));
      };
      ObserveOnSubscriber.prototype._error = function (err) {
          this.scheduleMessage(Notification.createError(err));
          this.unsubscribe();
      };
      ObserveOnSubscriber.prototype._complete = function () {
          this.scheduleMessage(Notification.createComplete());
          this.unsubscribe();
      };
      return ObserveOnSubscriber;
  }(Subscriber));
  var ObserveOnMessage = /*@__PURE__*/ (function () {
      function ObserveOnMessage(notification, destination) {
          this.notification = notification;
          this.destination = destination;
      }
      return ObserveOnMessage;
  }());
  //# sourceMappingURL=observeOn.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_scheduler_queue,_Subscription,_operators_observeOn,_util_ObjectUnsubscribedError,_SubjectSubscription PURE_IMPORTS_END */
  var ReplaySubject = /*@__PURE__*/ (function (_super) {
      __extends(ReplaySubject, _super);
      function ReplaySubject(bufferSize, windowTime, scheduler) {
          if (bufferSize === void 0) {
              bufferSize = Number.POSITIVE_INFINITY;
          }
          if (windowTime === void 0) {
              windowTime = Number.POSITIVE_INFINITY;
          }
          var _this = _super.call(this) || this;
          _this.scheduler = scheduler;
          _this._events = [];
          _this._infiniteTimeWindow = false;
          _this._bufferSize = bufferSize < 1 ? 1 : bufferSize;
          _this._windowTime = windowTime < 1 ? 1 : windowTime;
          if (windowTime === Number.POSITIVE_INFINITY) {
              _this._infiniteTimeWindow = true;
              _this.next = _this.nextInfiniteTimeWindow;
          }
          else {
              _this.next = _this.nextTimeWindow;
          }
          return _this;
      }
      ReplaySubject.prototype.nextInfiniteTimeWindow = function (value) {
          var _events = this._events;
          _events.push(value);
          if (_events.length > this._bufferSize) {
              _events.shift();
          }
          _super.prototype.next.call(this, value);
      };
      ReplaySubject.prototype.nextTimeWindow = function (value) {
          this._events.push(new ReplayEvent(this._getNow(), value));
          this._trimBufferThenGetEvents();
          _super.prototype.next.call(this, value);
      };
      ReplaySubject.prototype._subscribe = function (subscriber) {
          var _infiniteTimeWindow = this._infiniteTimeWindow;
          var _events = _infiniteTimeWindow ? this._events : this._trimBufferThenGetEvents();
          var scheduler = this.scheduler;
          var len = _events.length;
          var subscription;
          if (this.closed) {
              throw new ObjectUnsubscribedError();
          }
          else if (this.isStopped || this.hasError) {
              subscription = Subscription.EMPTY;
          }
          else {
              this.observers.push(subscriber);
              subscription = new SubjectSubscription(this, subscriber);
          }
          if (scheduler) {
              subscriber.add(subscriber = new ObserveOnSubscriber(subscriber, scheduler));
          }
          if (_infiniteTimeWindow) {
              for (var i = 0; i < len && !subscriber.closed; i++) {
                  subscriber.next(_events[i]);
              }
          }
          else {
              for (var i = 0; i < len && !subscriber.closed; i++) {
                  subscriber.next(_events[i].value);
              }
          }
          if (this.hasError) {
              subscriber.error(this.thrownError);
          }
          else if (this.isStopped) {
              subscriber.complete();
          }
          return subscription;
      };
      ReplaySubject.prototype._getNow = function () {
          return (this.scheduler || queue).now();
      };
      ReplaySubject.prototype._trimBufferThenGetEvents = function () {
          var now = this._getNow();
          var _bufferSize = this._bufferSize;
          var _windowTime = this._windowTime;
          var _events = this._events;
          var eventsCount = _events.length;
          var spliceCount = 0;
          while (spliceCount < eventsCount) {
              if ((now - _events[spliceCount].time) < _windowTime) {
                  break;
              }
              spliceCount++;
          }
          if (eventsCount > _bufferSize) {
              spliceCount = Math.max(spliceCount, eventsCount - _bufferSize);
          }
          if (spliceCount > 0) {
              _events.splice(0, spliceCount);
          }
          return _events;
      };
      return ReplaySubject;
  }(Subject));
  var ReplayEvent = /*@__PURE__*/ (function () {
      function ReplayEvent(time, value) {
          this.time = time;
          this.value = value;
      }
      return ReplayEvent;
  }());
  //# sourceMappingURL=ReplaySubject.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_Subscription PURE_IMPORTS_END */
  var AsyncSubject = /*@__PURE__*/ (function (_super) {
      __extends(AsyncSubject, _super);
      function AsyncSubject() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.value = null;
          _this.hasNext = false;
          _this.hasCompleted = false;
          return _this;
      }
      AsyncSubject.prototype._subscribe = function (subscriber) {
          if (this.hasError) {
              subscriber.error(this.thrownError);
              return Subscription.EMPTY;
          }
          else if (this.hasCompleted && this.hasNext) {
              subscriber.next(this.value);
              subscriber.complete();
              return Subscription.EMPTY;
          }
          return _super.prototype._subscribe.call(this, subscriber);
      };
      AsyncSubject.prototype.next = function (value) {
          if (!this.hasCompleted) {
              this.value = value;
              this.hasNext = true;
          }
      };
      AsyncSubject.prototype.error = function (error) {
          if (!this.hasCompleted) {
              _super.prototype.error.call(this, error);
          }
      };
      AsyncSubject.prototype.complete = function () {
          this.hasCompleted = true;
          if (this.hasNext) {
              _super.prototype.next.call(this, this.value);
          }
          _super.prototype.complete.call(this);
      };
      return AsyncSubject;
  }(Subject));
  //# sourceMappingURL=AsyncSubject.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var nextHandle = 1;
  var tasksByHandle = {};
  function runIfPresent(handle) {
      var cb = tasksByHandle[handle];
      if (cb) {
          cb();
      }
  }
  var Immediate = {
      setImmediate: function (cb) {
          var handle = nextHandle++;
          tasksByHandle[handle] = cb;
          Promise.resolve().then(function () { return runIfPresent(handle); });
          return handle;
      },
      clearImmediate: function (handle) {
          delete tasksByHandle[handle];
      },
  };
  //# sourceMappingURL=Immediate.js.map

  /** PURE_IMPORTS_START tslib,_util_Immediate,_AsyncAction PURE_IMPORTS_END */
  var AsapAction = /*@__PURE__*/ (function (_super) {
      __extends(AsapAction, _super);
      function AsapAction(scheduler, work) {
          var _this = _super.call(this, scheduler, work) || this;
          _this.scheduler = scheduler;
          _this.work = work;
          return _this;
      }
      AsapAction.prototype.requestAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if (delay !== null && delay > 0) {
              return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
          }
          scheduler.actions.push(this);
          return scheduler.scheduled || (scheduler.scheduled = Immediate.setImmediate(scheduler.flush.bind(scheduler, null)));
      };
      AsapAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
              return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
          }
          if (scheduler.actions.length === 0) {
              Immediate.clearImmediate(id);
              scheduler.scheduled = undefined;
          }
          return undefined;
      };
      return AsapAction;
  }(AsyncAction));
  //# sourceMappingURL=AsapAction.js.map

  /** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */
  var AsapScheduler = /*@__PURE__*/ (function (_super) {
      __extends(AsapScheduler, _super);
      function AsapScheduler() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      AsapScheduler.prototype.flush = function (action) {
          this.active = true;
          this.scheduled = undefined;
          var actions = this.actions;
          var error;
          var index = -1;
          var count = actions.length;
          action = action || actions.shift();
          do {
              if (error = action.execute(action.state, action.delay)) {
                  break;
              }
          } while (++index < count && (action = actions.shift()));
          this.active = false;
          if (error) {
              while (++index < count && (action = actions.shift())) {
                  action.unsubscribe();
              }
              throw error;
          }
      };
      return AsapScheduler;
  }(AsyncScheduler));
  //# sourceMappingURL=AsapScheduler.js.map

  /** PURE_IMPORTS_START _AsapAction,_AsapScheduler PURE_IMPORTS_END */
  var asap = /*@__PURE__*/ new AsapScheduler(AsapAction);
  //# sourceMappingURL=asap.js.map

  /** PURE_IMPORTS_START _AsyncAction,_AsyncScheduler PURE_IMPORTS_END */
  var async = /*@__PURE__*/ new AsyncScheduler(AsyncAction);
  //# sourceMappingURL=async.js.map

  /** PURE_IMPORTS_START tslib,_AsyncAction PURE_IMPORTS_END */
  var AnimationFrameAction = /*@__PURE__*/ (function (_super) {
      __extends(AnimationFrameAction, _super);
      function AnimationFrameAction(scheduler, work) {
          var _this = _super.call(this, scheduler, work) || this;
          _this.scheduler = scheduler;
          _this.work = work;
          return _this;
      }
      AnimationFrameAction.prototype.requestAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if (delay !== null && delay > 0) {
              return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
          }
          scheduler.actions.push(this);
          return scheduler.scheduled || (scheduler.scheduled = requestAnimationFrame(function () { return scheduler.flush(null); }));
      };
      AnimationFrameAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if ((delay !== null && delay > 0) || (delay === null && this.delay > 0)) {
              return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
          }
          if (scheduler.actions.length === 0) {
              cancelAnimationFrame(id);
              scheduler.scheduled = undefined;
          }
          return undefined;
      };
      return AnimationFrameAction;
  }(AsyncAction));
  //# sourceMappingURL=AnimationFrameAction.js.map

  /** PURE_IMPORTS_START tslib,_AsyncScheduler PURE_IMPORTS_END */
  var AnimationFrameScheduler = /*@__PURE__*/ (function (_super) {
      __extends(AnimationFrameScheduler, _super);
      function AnimationFrameScheduler() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      AnimationFrameScheduler.prototype.flush = function (action) {
          this.active = true;
          this.scheduled = undefined;
          var actions = this.actions;
          var error;
          var index = -1;
          var count = actions.length;
          action = action || actions.shift();
          do {
              if (error = action.execute(action.state, action.delay)) {
                  break;
              }
          } while (++index < count && (action = actions.shift()));
          this.active = false;
          if (error) {
              while (++index < count && (action = actions.shift())) {
                  action.unsubscribe();
              }
              throw error;
          }
      };
      return AnimationFrameScheduler;
  }(AsyncScheduler));
  //# sourceMappingURL=AnimationFrameScheduler.js.map

  /** PURE_IMPORTS_START _AnimationFrameAction,_AnimationFrameScheduler PURE_IMPORTS_END */
  var animationFrame = /*@__PURE__*/ new AnimationFrameScheduler(AnimationFrameAction);
  //# sourceMappingURL=animationFrame.js.map

  /** PURE_IMPORTS_START tslib,_AsyncAction,_AsyncScheduler PURE_IMPORTS_END */
  var VirtualTimeScheduler = /*@__PURE__*/ (function (_super) {
      __extends(VirtualTimeScheduler, _super);
      function VirtualTimeScheduler(SchedulerAction, maxFrames) {
          if (SchedulerAction === void 0) {
              SchedulerAction = VirtualAction;
          }
          if (maxFrames === void 0) {
              maxFrames = Number.POSITIVE_INFINITY;
          }
          var _this = _super.call(this, SchedulerAction, function () { return _this.frame; }) || this;
          _this.maxFrames = maxFrames;
          _this.frame = 0;
          _this.index = -1;
          return _this;
      }
      VirtualTimeScheduler.prototype.flush = function () {
          var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
          var error, action;
          while ((action = actions.shift()) && (this.frame = action.delay) <= maxFrames) {
              if (error = action.execute(action.state, action.delay)) {
                  break;
              }
          }
          if (error) {
              while (action = actions.shift()) {
                  action.unsubscribe();
              }
              throw error;
          }
      };
      VirtualTimeScheduler.frameTimeFactor = 10;
      return VirtualTimeScheduler;
  }(AsyncScheduler));
  var VirtualAction = /*@__PURE__*/ (function (_super) {
      __extends(VirtualAction, _super);
      function VirtualAction(scheduler, work, index) {
          if (index === void 0) {
              index = scheduler.index += 1;
          }
          var _this = _super.call(this, scheduler, work) || this;
          _this.scheduler = scheduler;
          _this.work = work;
          _this.index = index;
          _this.active = true;
          _this.index = scheduler.index = index;
          return _this;
      }
      VirtualAction.prototype.schedule = function (state, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          if (!this.id) {
              return _super.prototype.schedule.call(this, state, delay);
          }
          this.active = false;
          var action = new VirtualAction(this.scheduler, this.work);
          this.add(action);
          return action.schedule(state, delay);
      };
      VirtualAction.prototype.requestAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          this.delay = scheduler.frame + delay;
          var actions = scheduler.actions;
          actions.push(this);
          actions.sort(VirtualAction.sortActions);
          return true;
      };
      VirtualAction.prototype.recycleAsyncId = function (scheduler, id, delay) {
          if (delay === void 0) {
              delay = 0;
          }
          return undefined;
      };
      VirtualAction.prototype._execute = function (state, delay) {
          if (this.active === true) {
              return _super.prototype._execute.call(this, state, delay);
          }
      };
      VirtualAction.sortActions = function (a, b) {
          if (a.delay === b.delay) {
              if (a.index === b.index) {
                  return 0;
              }
              else if (a.index > b.index) {
                  return 1;
              }
              else {
                  return -1;
              }
          }
          else if (a.delay > b.delay) {
              return 1;
          }
          else {
              return -1;
          }
      };
      return VirtualAction;
  }(AsyncAction));
  //# sourceMappingURL=VirtualTimeScheduler.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function identity$1(x) {
      return x;
  }
  //# sourceMappingURL=identity.js.map

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  //# sourceMappingURL=isObservable.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function ArgumentOutOfRangeErrorImpl() {
      Error.call(this);
      this.message = 'argument out of range';
      this.name = 'ArgumentOutOfRangeError';
      return this;
  }
  ArgumentOutOfRangeErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
  var ArgumentOutOfRangeError = ArgumentOutOfRangeErrorImpl;
  //# sourceMappingURL=ArgumentOutOfRangeError.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function EmptyErrorImpl() {
      Error.call(this);
      this.message = 'no elements in sequence';
      this.name = 'EmptyError';
      return this;
  }
  EmptyErrorImpl.prototype = /*@__PURE__*/ Object.create(Error.prototype);
  var EmptyError = EmptyErrorImpl;
  //# sourceMappingURL=EmptyError.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  //# sourceMappingURL=TimeoutError.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  function map(project, thisArg) {
      return function mapOperation(source) {
          if (typeof project !== 'function') {
              throw new TypeError('argument is not a function. Are you looking for `mapTo()`?');
          }
          return source.lift(new MapOperator(project, thisArg));
      };
  }
  var MapOperator = /*@__PURE__*/ (function () {
      function MapOperator(project, thisArg) {
          this.project = project;
          this.thisArg = thisArg;
      }
      MapOperator.prototype.call = function (subscriber, source) {
          return source.subscribe(new MapSubscriber(subscriber, this.project, this.thisArg));
      };
      return MapOperator;
  }());
  var MapSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(MapSubscriber, _super);
      function MapSubscriber(destination, project, thisArg) {
          var _this = _super.call(this, destination) || this;
          _this.project = project;
          _this.count = 0;
          _this.thisArg = thisArg || _this;
          return _this;
      }
      MapSubscriber.prototype._next = function (value) {
          var result;
          try {
              result = this.project.call(this.thisArg, value, this.count++);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.destination.next(result);
      };
      return MapSubscriber;
  }(Subscriber));
  //# sourceMappingURL=map.js.map

  /** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_canReportError,_util_isArray,_util_isScheduler PURE_IMPORTS_END */
  //# sourceMappingURL=bindCallback.js.map

  /** PURE_IMPORTS_START _Observable,_AsyncSubject,_operators_map,_util_canReportError,_util_isScheduler,_util_isArray PURE_IMPORTS_END */
  //# sourceMappingURL=bindNodeCallback.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var OuterSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(OuterSubscriber, _super);
      function OuterSubscriber() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      OuterSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.destination.next(innerValue);
      };
      OuterSubscriber.prototype.notifyError = function (error, innerSub) {
          this.destination.error(error);
      };
      OuterSubscriber.prototype.notifyComplete = function (innerSub) {
          this.destination.complete();
      };
      return OuterSubscriber;
  }(Subscriber));
  //# sourceMappingURL=OuterSubscriber.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var InnerSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(InnerSubscriber, _super);
      function InnerSubscriber(parent, outerValue, outerIndex) {
          var _this = _super.call(this) || this;
          _this.parent = parent;
          _this.outerValue = outerValue;
          _this.outerIndex = outerIndex;
          _this.index = 0;
          return _this;
      }
      InnerSubscriber.prototype._next = function (value) {
          this.parent.notifyNext(this.outerValue, value, this.outerIndex, this.index++, this);
      };
      InnerSubscriber.prototype._error = function (error) {
          this.parent.notifyError(error, this);
          this.unsubscribe();
      };
      InnerSubscriber.prototype._complete = function () {
          this.parent.notifyComplete(this);
          this.unsubscribe();
      };
      return InnerSubscriber;
  }(Subscriber));
  //# sourceMappingURL=InnerSubscriber.js.map

  /** PURE_IMPORTS_START _hostReportError PURE_IMPORTS_END */
  var subscribeToPromise = function (promise) {
      return function (subscriber) {
          promise.then(function (value) {
              if (!subscriber.closed) {
                  subscriber.next(value);
                  subscriber.complete();
              }
          }, function (err) { return subscriber.error(err); })
              .then(null, hostReportError);
          return subscriber;
      };
  };
  //# sourceMappingURL=subscribeToPromise.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function getSymbolIterator() {
      if (typeof Symbol !== 'function' || !Symbol.iterator) {
          return '@@iterator';
      }
      return Symbol.iterator;
  }
  var iterator = /*@__PURE__*/ getSymbolIterator();
  //# sourceMappingURL=iterator.js.map

  /** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */
  var subscribeToIterable = function (iterable) {
      return function (subscriber) {
          var iterator$$1 = iterable[iterator]();
          do {
              var item = iterator$$1.next();
              if (item.done) {
                  subscriber.complete();
                  break;
              }
              subscriber.next(item.value);
              if (subscriber.closed) {
                  break;
              }
          } while (true);
          if (typeof iterator$$1.return === 'function') {
              subscriber.add(function () {
                  if (iterator$$1.return) {
                      iterator$$1.return();
                  }
              });
          }
          return subscriber;
      };
  };
  //# sourceMappingURL=subscribeToIterable.js.map

  /** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */
  var subscribeToObservable = function (obj) {
      return function (subscriber) {
          var obs = obj[observable]();
          if (typeof obs.subscribe !== 'function') {
              throw new TypeError('Provided object does not correctly implement Symbol.observable');
          }
          else {
              return obs.subscribe(subscriber);
          }
      };
  };
  //# sourceMappingURL=subscribeToObservable.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  var isArrayLike$1 = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });
  //# sourceMappingURL=isArrayLike.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  function isPromise(value) {
      return value && typeof value.subscribe !== 'function' && typeof value.then === 'function';
  }
  //# sourceMappingURL=isPromise.js.map

  /** PURE_IMPORTS_START _Observable,_subscribeToArray,_subscribeToPromise,_subscribeToIterable,_subscribeToObservable,_isArrayLike,_isPromise,_isObject,_symbol_iterator,_symbol_observable PURE_IMPORTS_END */
  var subscribeTo = function (result) {
      if (result instanceof Observable) {
          return function (subscriber) {
              if (result._isScalar) {
                  subscriber.next(result.value);
                  subscriber.complete();
                  return undefined;
              }
              else {
                  return result.subscribe(subscriber);
              }
          };
      }
      else if (result && typeof result[observable] === 'function') {
          return subscribeToObservable(result);
      }
      else if (isArrayLike$1(result)) {
          return subscribeToArray(result);
      }
      else if (isPromise(result)) {
          return subscribeToPromise(result);
      }
      else if (result && typeof result[iterator] === 'function') {
          return subscribeToIterable(result);
      }
      else {
          var value = isObject$1(result) ? 'an invalid object' : "'" + result + "'";
          var msg = "You provided " + value + " where a stream was expected."
              + ' You can provide an Observable, Promise, Array, or Iterable.';
          throw new TypeError(msg);
      }
  };
  //# sourceMappingURL=subscribeTo.js.map

  /** PURE_IMPORTS_START _InnerSubscriber,_subscribeTo PURE_IMPORTS_END */
  function subscribeToResult(outerSubscriber, result, outerValue, outerIndex, destination) {
      if (destination === void 0) {
          destination = new InnerSubscriber(outerSubscriber, outerValue, outerIndex);
      }
      if (destination.closed) {
          return;
      }
      return subscribeTo(result)(destination);
  }
  //# sourceMappingURL=subscribeToResult.js.map

  /** PURE_IMPORTS_START tslib,_util_isScheduler,_util_isArray,_OuterSubscriber,_util_subscribeToResult,_fromArray PURE_IMPORTS_END */
  var NONE = {};
  var CombineLatestSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(CombineLatestSubscriber, _super);
      function CombineLatestSubscriber(destination, resultSelector) {
          var _this = _super.call(this, destination) || this;
          _this.resultSelector = resultSelector;
          _this.active = 0;
          _this.values = [];
          _this.observables = [];
          return _this;
      }
      CombineLatestSubscriber.prototype._next = function (observable) {
          this.values.push(NONE);
          this.observables.push(observable);
      };
      CombineLatestSubscriber.prototype._complete = function () {
          var observables = this.observables;
          var len = observables.length;
          if (len === 0) {
              this.destination.complete();
          }
          else {
              this.active = len;
              this.toRespond = len;
              for (var i = 0; i < len; i++) {
                  var observable = observables[i];
                  this.add(subscribeToResult(this, observable, observable, i));
              }
          }
      };
      CombineLatestSubscriber.prototype.notifyComplete = function (unused) {
          if ((this.active -= 1) === 0) {
              this.destination.complete();
          }
      };
      CombineLatestSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          var values = this.values;
          var oldVal = values[outerIndex];
          var toRespond = !this.toRespond
              ? 0
              : oldVal === NONE ? --this.toRespond : this.toRespond;
          values[outerIndex] = innerValue;
          if (toRespond === 0) {
              if (this.resultSelector) {
                  this._tryResultSelector(values);
              }
              else {
                  this.destination.next(values.slice());
              }
          }
      };
      CombineLatestSubscriber.prototype._tryResultSelector = function (values) {
          var result;
          try {
              result = this.resultSelector.apply(this, values);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.destination.next(result);
      };
      return CombineLatestSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=combineLatest.js.map

  /** PURE_IMPORTS_START _symbol_observable PURE_IMPORTS_END */
  function isInteropObservable(input) {
      return input && typeof input[observable] === 'function';
  }
  //# sourceMappingURL=isInteropObservable.js.map

  /** PURE_IMPORTS_START _symbol_iterator PURE_IMPORTS_END */
  function isIterable(input) {
      return input && typeof input[iterator] === 'function';
  }
  //# sourceMappingURL=isIterable.js.map

  /** PURE_IMPORTS_START _Observable,_Subscription,_util_subscribeToPromise PURE_IMPORTS_END */
  function fromPromise(input, scheduler) {
      if (!scheduler) {
          return new Observable(subscribeToPromise(input));
      }
      else {
          return new Observable(function (subscriber) {
              var sub = new Subscription();
              sub.add(scheduler.schedule(function () {
                  return input.then(function (value) {
                      sub.add(scheduler.schedule(function () {
                          subscriber.next(value);
                          sub.add(scheduler.schedule(function () { return subscriber.complete(); }));
                      }));
                  }, function (err) {
                      sub.add(scheduler.schedule(function () { return subscriber.error(err); }));
                  });
              }));
              return sub;
          });
      }
  }
  //# sourceMappingURL=fromPromise.js.map

  /** PURE_IMPORTS_START _Observable,_Subscription,_symbol_iterator,_util_subscribeToIterable PURE_IMPORTS_END */
  function fromIterable(input, scheduler) {
      if (!input) {
          throw new Error('Iterable cannot be null');
      }
      if (!scheduler) {
          return new Observable(subscribeToIterable(input));
      }
      else {
          return new Observable(function (subscriber) {
              var sub = new Subscription();
              var iterator$$1;
              sub.add(function () {
                  if (iterator$$1 && typeof iterator$$1.return === 'function') {
                      iterator$$1.return();
                  }
              });
              sub.add(scheduler.schedule(function () {
                  iterator$$1 = input[iterator]();
                  sub.add(scheduler.schedule(function () {
                      if (subscriber.closed) {
                          return;
                      }
                      var value;
                      var done;
                      try {
                          var result = iterator$$1.next();
                          value = result.value;
                          done = result.done;
                      }
                      catch (err) {
                          subscriber.error(err);
                          return;
                      }
                      if (done) {
                          subscriber.complete();
                      }
                      else {
                          subscriber.next(value);
                          this.schedule();
                      }
                  }));
              }));
              return sub;
          });
      }
  }
  //# sourceMappingURL=fromIterable.js.map

  /** PURE_IMPORTS_START _Observable,_Subscription,_symbol_observable,_util_subscribeToObservable PURE_IMPORTS_END */
  function fromObservable(input, scheduler) {
      if (!scheduler) {
          return new Observable(subscribeToObservable(input));
      }
      else {
          return new Observable(function (subscriber) {
              var sub = new Subscription();
              sub.add(scheduler.schedule(function () {
                  var observable$$1 = input[observable]();
                  sub.add(observable$$1.subscribe({
                      next: function (value) { sub.add(scheduler.schedule(function () { return subscriber.next(value); })); },
                      error: function (err) { sub.add(scheduler.schedule(function () { return subscriber.error(err); })); },
                      complete: function () { sub.add(scheduler.schedule(function () { return subscriber.complete(); })); },
                  }));
              }));
              return sub;
          });
      }
  }
  //# sourceMappingURL=fromObservable.js.map

  /** PURE_IMPORTS_START _Observable,_util_isPromise,_util_isArrayLike,_util_isInteropObservable,_util_isIterable,_fromArray,_fromPromise,_fromIterable,_fromObservable,_util_subscribeTo PURE_IMPORTS_END */
  function from(input, scheduler) {
      if (!scheduler) {
          if (input instanceof Observable) {
              return input;
          }
          return new Observable(subscribeTo(input));
      }
      if (input != null) {
          if (isInteropObservable(input)) {
              return fromObservable(input, scheduler);
          }
          else if (isPromise(input)) {
              return fromPromise(input, scheduler);
          }
          else if (isArrayLike$1(input)) {
              return fromArray(input, scheduler);
          }
          else if (isIterable(input) || typeof input === 'string') {
              return fromIterable(input, scheduler);
          }
      }
      throw new TypeError((input !== null && typeof input || input) + ' is not observable');
  }
  //# sourceMappingURL=from.js.map

  /** PURE_IMPORTS_START tslib,_util_subscribeToResult,_OuterSubscriber,_InnerSubscriber,_map,_observable_from PURE_IMPORTS_END */
  function mergeMap(project, resultSelector, concurrent) {
      if (concurrent === void 0) {
          concurrent = Number.POSITIVE_INFINITY;
      }
      if (typeof resultSelector === 'function') {
          return function (source) { return source.pipe(mergeMap(function (a, i) { return from(project(a, i)).pipe(map(function (b, ii) { return resultSelector(a, b, i, ii); })); }, concurrent)); };
      }
      else if (typeof resultSelector === 'number') {
          concurrent = resultSelector;
      }
      return function (source) { return source.lift(new MergeMapOperator(project, concurrent)); };
  }
  var MergeMapOperator = /*@__PURE__*/ (function () {
      function MergeMapOperator(project, concurrent) {
          if (concurrent === void 0) {
              concurrent = Number.POSITIVE_INFINITY;
          }
          this.project = project;
          this.concurrent = concurrent;
      }
      MergeMapOperator.prototype.call = function (observer, source) {
          return source.subscribe(new MergeMapSubscriber(observer, this.project, this.concurrent));
      };
      return MergeMapOperator;
  }());
  var MergeMapSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(MergeMapSubscriber, _super);
      function MergeMapSubscriber(destination, project, concurrent) {
          if (concurrent === void 0) {
              concurrent = Number.POSITIVE_INFINITY;
          }
          var _this = _super.call(this, destination) || this;
          _this.project = project;
          _this.concurrent = concurrent;
          _this.hasCompleted = false;
          _this.buffer = [];
          _this.active = 0;
          _this.index = 0;
          return _this;
      }
      MergeMapSubscriber.prototype._next = function (value) {
          if (this.active < this.concurrent) {
              this._tryNext(value);
          }
          else {
              this.buffer.push(value);
          }
      };
      MergeMapSubscriber.prototype._tryNext = function (value) {
          var result;
          var index = this.index++;
          try {
              result = this.project(value, index);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.active++;
          this._innerSub(result, value, index);
      };
      MergeMapSubscriber.prototype._innerSub = function (ish, value, index) {
          var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
          var destination = this.destination;
          destination.add(innerSubscriber);
          subscribeToResult(this, ish, value, index, innerSubscriber);
      };
      MergeMapSubscriber.prototype._complete = function () {
          this.hasCompleted = true;
          if (this.active === 0 && this.buffer.length === 0) {
              this.destination.complete();
          }
          this.unsubscribe();
      };
      MergeMapSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.destination.next(innerValue);
      };
      MergeMapSubscriber.prototype.notifyComplete = function (innerSub) {
          var buffer = this.buffer;
          this.remove(innerSub);
          this.active--;
          if (buffer.length > 0) {
              this._next(buffer.shift());
          }
          else if (this.active === 0 && this.hasCompleted) {
              this.destination.complete();
          }
      };
      return MergeMapSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=mergeMap.js.map

  /** PURE_IMPORTS_START _mergeMap,_util_identity PURE_IMPORTS_END */
  function mergeAll(concurrent) {
      if (concurrent === void 0) {
          concurrent = Number.POSITIVE_INFINITY;
      }
      return mergeMap(identity$1, concurrent);
  }
  //# sourceMappingURL=mergeAll.js.map

  /** PURE_IMPORTS_START _mergeAll PURE_IMPORTS_END */
  //# sourceMappingURL=concatAll.js.map

  /** PURE_IMPORTS_START _util_isScheduler,_of,_from,_operators_concatAll PURE_IMPORTS_END */
  //# sourceMappingURL=concat.js.map

  /** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */
  //# sourceMappingURL=defer.js.map

  /** PURE_IMPORTS_START tslib,_Observable,_util_isArray,_empty,_util_subscribeToResult,_OuterSubscriber,_operators_map PURE_IMPORTS_END */
  var ForkJoinSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ForkJoinSubscriber, _super);
      function ForkJoinSubscriber(destination, sources) {
          var _this = _super.call(this, destination) || this;
          _this.sources = sources;
          _this.completed = 0;
          _this.haveValues = 0;
          var len = sources.length;
          _this.values = new Array(len);
          for (var i = 0; i < len; i++) {
              var source = sources[i];
              var innerSubscription = subscribeToResult(_this, source, null, i);
              if (innerSubscription) {
                  _this.add(innerSubscription);
              }
          }
          return _this;
      }
      ForkJoinSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.values[outerIndex] = innerValue;
          if (!innerSub._hasValue) {
              innerSub._hasValue = true;
              this.haveValues++;
          }
      };
      ForkJoinSubscriber.prototype.notifyComplete = function (innerSub) {
          var _a = this, destination = _a.destination, haveValues = _a.haveValues, values = _a.values;
          var len = values.length;
          if (!innerSub._hasValue) {
              destination.complete();
              return;
          }
          this.completed++;
          if (this.completed !== len) {
              return;
          }
          if (haveValues === len) {
              destination.next(values);
          }
          destination.complete();
      };
      return ForkJoinSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=forkJoin.js.map

  /** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */
  //# sourceMappingURL=fromEvent.js.map

  /** PURE_IMPORTS_START _Observable,_util_isArray,_util_isFunction,_operators_map PURE_IMPORTS_END */
  function fromEventPattern(addHandler, removeHandler, resultSelector) {
      if (resultSelector) {
          return fromEventPattern(addHandler, removeHandler).pipe(map(function (args) { return isArray$1(args) ? resultSelector.apply(void 0, args) : resultSelector(args); }));
      }
      return new Observable(function (subscriber) {
          var handler = function () {
              var e = [];
              for (var _i = 0; _i < arguments.length; _i++) {
                  e[_i] = arguments[_i];
              }
              return subscriber.next(e.length === 1 ? e[0] : e);
          };
          var retValue;
          try {
              retValue = addHandler(handler);
          }
          catch (err) {
              subscriber.error(err);
              return undefined;
          }
          if (!isFunction$1(removeHandler)) {
              return undefined;
          }
          return function () { return removeHandler(handler, retValue); };
      });
  }
  //# sourceMappingURL=fromEventPattern.js.map

  /** PURE_IMPORTS_START _Observable,_util_identity,_util_isScheduler PURE_IMPORTS_END */
  //# sourceMappingURL=generate.js.map

  /** PURE_IMPORTS_START _defer,_empty PURE_IMPORTS_END */
  //# sourceMappingURL=iif.js.map

  /** PURE_IMPORTS_START _isArray PURE_IMPORTS_END */
  function isNumeric(val) {
      return !isArray$1(val) && (val - parseFloat(val) + 1) >= 0;
  }
  //# sourceMappingURL=isNumeric.js.map

  /** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric PURE_IMPORTS_END */
  //# sourceMappingURL=interval.js.map

  /** PURE_IMPORTS_START _Observable,_util_isScheduler,_operators_mergeAll,_fromArray PURE_IMPORTS_END */
  function merge() {
      var observables = [];
      for (var _i = 0; _i < arguments.length; _i++) {
          observables[_i] = arguments[_i];
      }
      var concurrent = Number.POSITIVE_INFINITY;
      var scheduler = null;
      var last = observables[observables.length - 1];
      if (isScheduler(last)) {
          scheduler = observables.pop();
          if (observables.length > 1 && typeof observables[observables.length - 1] === 'number') {
              concurrent = observables.pop();
          }
      }
      else if (typeof last === 'number') {
          concurrent = observables.pop();
      }
      if (scheduler === null && observables.length === 1 && observables[0] instanceof Observable) {
          return observables[0];
      }
      return mergeAll(concurrent)(fromArray(observables, scheduler));
  }
  //# sourceMappingURL=merge.js.map

  /** PURE_IMPORTS_START _Observable,_util_noop PURE_IMPORTS_END */
  var NEVER = /*@__PURE__*/ new Observable(noop);
  //# sourceMappingURL=never.js.map

  /** PURE_IMPORTS_START _Observable,_from,_util_isArray,_empty PURE_IMPORTS_END */
  //# sourceMappingURL=onErrorResumeNext.js.map

  /** PURE_IMPORTS_START _Observable,_Subscription PURE_IMPORTS_END */
  //# sourceMappingURL=pairs.js.map

  /** PURE_IMPORTS_START tslib,_util_isArray,_fromArray,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var RaceSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(RaceSubscriber, _super);
      function RaceSubscriber(destination) {
          var _this = _super.call(this, destination) || this;
          _this.hasFirst = false;
          _this.observables = [];
          _this.subscriptions = [];
          return _this;
      }
      RaceSubscriber.prototype._next = function (observable) {
          this.observables.push(observable);
      };
      RaceSubscriber.prototype._complete = function () {
          var observables = this.observables;
          var len = observables.length;
          if (len === 0) {
              this.destination.complete();
          }
          else {
              for (var i = 0; i < len && !this.hasFirst; i++) {
                  var observable = observables[i];
                  var subscription = subscribeToResult(this, observable, observable, i);
                  if (this.subscriptions) {
                      this.subscriptions.push(subscription);
                  }
                  this.add(subscription);
              }
              this.observables = null;
          }
      };
      RaceSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          if (!this.hasFirst) {
              this.hasFirst = true;
              for (var i = 0; i < this.subscriptions.length; i++) {
                  if (i !== outerIndex) {
                      var subscription = this.subscriptions[i];
                      subscription.unsubscribe();
                      this.remove(subscription);
                  }
              }
              this.subscriptions = null;
          }
          this.destination.next(innerValue);
      };
      return RaceSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=race.js.map

  /** PURE_IMPORTS_START _Observable PURE_IMPORTS_END */
  //# sourceMappingURL=range.js.map

  /** PURE_IMPORTS_START _Observable,_scheduler_async,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */
  //# sourceMappingURL=timer.js.map

  /** PURE_IMPORTS_START _Observable,_from,_empty PURE_IMPORTS_END */
  //# sourceMappingURL=using.js.map

  /** PURE_IMPORTS_START tslib,_fromArray,_util_isArray,_Subscriber,_OuterSubscriber,_util_subscribeToResult,_.._internal_symbol_iterator PURE_IMPORTS_END */
  var ZipSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ZipSubscriber, _super);
      function ZipSubscriber(destination, resultSelector, values) {
          if (values === void 0) {
              values = Object.create(null);
          }
          var _this = _super.call(this, destination) || this;
          _this.iterators = [];
          _this.active = 0;
          _this.resultSelector = (typeof resultSelector === 'function') ? resultSelector : null;
          _this.values = values;
          return _this;
      }
      ZipSubscriber.prototype._next = function (value) {
          var iterators = this.iterators;
          if (isArray$1(value)) {
              iterators.push(new StaticArrayIterator(value));
          }
          else if (typeof value[iterator] === 'function') {
              iterators.push(new StaticIterator(value[iterator]()));
          }
          else {
              iterators.push(new ZipBufferIterator(this.destination, this, value));
          }
      };
      ZipSubscriber.prototype._complete = function () {
          var iterators = this.iterators;
          var len = iterators.length;
          this.unsubscribe();
          if (len === 0) {
              this.destination.complete();
              return;
          }
          this.active = len;
          for (var i = 0; i < len; i++) {
              var iterator$$1 = iterators[i];
              if (iterator$$1.stillUnsubscribed) {
                  var destination = this.destination;
                  destination.add(iterator$$1.subscribe(iterator$$1, i));
              }
              else {
                  this.active--;
              }
          }
      };
      ZipSubscriber.prototype.notifyInactive = function () {
          this.active--;
          if (this.active === 0) {
              this.destination.complete();
          }
      };
      ZipSubscriber.prototype.checkIterators = function () {
          var iterators = this.iterators;
          var len = iterators.length;
          var destination = this.destination;
          for (var i = 0; i < len; i++) {
              var iterator$$1 = iterators[i];
              if (typeof iterator$$1.hasValue === 'function' && !iterator$$1.hasValue()) {
                  return;
              }
          }
          var shouldComplete = false;
          var args = [];
          for (var i = 0; i < len; i++) {
              var iterator$$1 = iterators[i];
              var result = iterator$$1.next();
              if (iterator$$1.hasCompleted()) {
                  shouldComplete = true;
              }
              if (result.done) {
                  destination.complete();
                  return;
              }
              args.push(result.value);
          }
          if (this.resultSelector) {
              this._tryresultSelector(args);
          }
          else {
              destination.next(args);
          }
          if (shouldComplete) {
              destination.complete();
          }
      };
      ZipSubscriber.prototype._tryresultSelector = function (args) {
          var result;
          try {
              result = this.resultSelector.apply(this, args);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.destination.next(result);
      };
      return ZipSubscriber;
  }(Subscriber));
  var StaticIterator = /*@__PURE__*/ (function () {
      function StaticIterator(iterator$$1) {
          this.iterator = iterator$$1;
          this.nextResult = iterator$$1.next();
      }
      StaticIterator.prototype.hasValue = function () {
          return true;
      };
      StaticIterator.prototype.next = function () {
          var result = this.nextResult;
          this.nextResult = this.iterator.next();
          return result;
      };
      StaticIterator.prototype.hasCompleted = function () {
          var nextResult = this.nextResult;
          return nextResult && nextResult.done;
      };
      return StaticIterator;
  }());
  var StaticArrayIterator = /*@__PURE__*/ (function () {
      function StaticArrayIterator(array) {
          this.array = array;
          this.index = 0;
          this.length = 0;
          this.length = array.length;
      }
      StaticArrayIterator.prototype[iterator] = function () {
          return this;
      };
      StaticArrayIterator.prototype.next = function (value) {
          var i = this.index++;
          var array = this.array;
          return i < this.length ? { value: array[i], done: false } : { value: null, done: true };
      };
      StaticArrayIterator.prototype.hasValue = function () {
          return this.array.length > this.index;
      };
      StaticArrayIterator.prototype.hasCompleted = function () {
          return this.array.length === this.index;
      };
      return StaticArrayIterator;
  }());
  var ZipBufferIterator = /*@__PURE__*/ (function (_super) {
      __extends(ZipBufferIterator, _super);
      function ZipBufferIterator(destination, parent, observable) {
          var _this = _super.call(this, destination) || this;
          _this.parent = parent;
          _this.observable = observable;
          _this.stillUnsubscribed = true;
          _this.buffer = [];
          _this.isComplete = false;
          return _this;
      }
      ZipBufferIterator.prototype[iterator] = function () {
          return this;
      };
      ZipBufferIterator.prototype.next = function () {
          var buffer = this.buffer;
          if (buffer.length === 0 && this.isComplete) {
              return { value: null, done: true };
          }
          else {
              return { value: buffer.shift(), done: false };
          }
      };
      ZipBufferIterator.prototype.hasValue = function () {
          return this.buffer.length > 0;
      };
      ZipBufferIterator.prototype.hasCompleted = function () {
          return this.buffer.length === 0 && this.isComplete;
      };
      ZipBufferIterator.prototype.notifyComplete = function () {
          if (this.buffer.length > 0) {
              this.isComplete = true;
              this.parent.notifyInactive();
          }
          else {
              this.destination.complete();
          }
      };
      ZipBufferIterator.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.buffer.push(innerValue);
          this.parent.checkIterators();
      };
      ZipBufferIterator.prototype.subscribe = function (value, index) {
          return subscribeToResult(this, this.observable, this, index);
      };
      return ZipBufferIterator;
  }(OuterSubscriber));
  //# sourceMappingURL=zip.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  //# sourceMappingURL=index.js.map

  let State = null;

  class StateManager {
    static getState() {
      return State;
    }

    static getState$() {
      return of(State);
    }

    static initState(sortItemsByType) {
      State = StateFactory.createState(sortItemsByType);
      return State;
    }

    static toggleRecord() {
      State = StateFactory.toggleRecord(State);
      return State;
    }

    static disableRecord() {
      State = StateFactory.disableRecord(State);
      return State;
    }

    static updateCurrentDomain(domain) {
      State = StateFactory.updateCurrentDomain(State, domain);
      return State;
    }

    static updateCurrentURL(currentURL) {
      State = StateFactory.updateCurrentURL(State, currentURL);
      return State;
    }

    static updateCanonicalURL(canonicalURL) {
      State = StateFactory.updateCanonicalURL(State, canonicalURL);
      return State;
    }

    static updateBrowserURL(browserURL) {
      State = StateFactory.updateBrowserURL(State, browserURL);
      return State;
    }

    static enableCurrentPageTracked() {
      State = StateFactory.enableCurrentPageTracked(State);
      return State;
    }

    static disableCurrentPageTracked() {
      State = StateFactory.disableCurrentPageTracked(State);
      return State;
    }

    static updateFaviconURL(faviconURL) {
      State = StateFactory.updateFaviconURL(State, faviconURL);
      return State;
    }

    static updateFaviconURLMapItem(tabId, faviconURL) {
      State = StateFactory.updateFaviconURLMapItem(State, tabId, faviconURL);
      return State;
    }

    static enableAutoSave(selection) {
      selection = selection || State.selection;
      State = StateFactory.enableAutoSave(State, selection);
      return State;
    }

    static disableAutoSave() {
      State = StateFactory.disableAutoSave(State);
      return State;
    }

    static enablePriceUpdate(selection) {
      State = StateFactory.enablePriceUpdate(State, selection);
      return State;
    }

    static disablePriceUpdate() {
      State = StateFactory.disablePriceUpdate(State);
      return State;
    }

    static setSelectionInfo(selection, price, faviconURL, faviconAlt) {
      State = StateFactory.setSelectionInfo(State, selection, price, faviconURL, faviconAlt);
      return State;
    }

    static setSimilarElementHighlight(isSimilarElementHighlighted, originalBackgroundColor) {
      State = StateFactory.setSimilarElementHighlight(State, isSimilarElementHighlighted, originalBackgroundColor);
      return State;
    }

    static incrementNotificationsCounter() {
      State = StateFactory.incrementNotificationsCounter(State);
      return State;
    }

    static deleteNotificationsItem(notificationId) {
      State = StateFactory.deleteNotificationsItem(State, notificationId);
      return State;
    }

    static updateNotificationsItem(notificationId, notificationState) {
      State = StateFactory.updateNotificationsItem(State, notificationId, notificationState);
      return State;
    }

    static updateSortItemsBy(_sortItemsBy) {
      State = StateFactory.updateSortItemsBy(State, _sortItemsBy);
      return State;
    }

    static addUndoRemovedItem(url, item, maxItems) {
      State = StateFactory.addUndoRemovedItem(State, url, item, maxItems);
      return State;
    }

    static getUndoRemovedItemsHead() {
      return StateFactory.getUndoRemovedItemsHead(State);
    }

    static removeUndoRemovedItem() {
      State = StateFactory.removeUndoRemovedItem(State);
      return State;
    }

    static resetUndoRemovedItems() {
      State = StateFactory.resetUndoRemovedItems(State);
      return State;
    }

    static setUndoRemovedItemsResetTask(task) {
      State = StateFactory.setUndoRemovedItemsResetTask(State, task);
      return State;
    }

    static toStorageStateFormat() {
      State = StateFactory.toStorageStateFormat(State);
      return State;
    }

  }

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
  function noop$1() {
    // No operation performed.
  }

  var noop_1 = noop$1;

  /** Used as references for various `Number` constants. */
  var INFINITY$2 = 1 / 0;

  /**
   * Creates a set object of `values`.
   *
   * @private
   * @param {Array} values The values to add to the set.
   * @returns {Object} Returns the new set.
   */
  var createSet = !(_Set && (1 / _setToArray(new _Set([,-0]))[1]) == INFINITY$2) ? noop_1 : function(values) {
    return new _Set(values);
  };

  var _createSet = createSet;

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE$1 = 200;

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
    else if (length >= LARGE_ARRAY_SIZE$1) {
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

  class Item {
    constructor(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage = null, currentPrice = price, timestamp, lastUpdateTimestamp) {
      this.selection = selection;
      this.price = price;
      this.currentPrice = currentPrice;
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
      currentPrice,
      timestamp,
      lastUpdateTimestamp
    }) {
      return new Item(selection, price, previousPrice, faviconURL, faviconAlt, statuses, diffPercentage, currentPrice, timestamp, lastUpdateTimestamp);
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

  function onXHR(url, callback) {
    const request = new XMLHttpRequest();

    request.onload = function () {
      const template = createHTMLTemplate(this.response);
      callback(template);
    };

    request.open("GET", url);
    request.send();
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

  /** PURE_IMPORTS_START tslib,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var AuditSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(AuditSubscriber, _super);
      function AuditSubscriber(destination, durationSelector) {
          var _this = _super.call(this, destination) || this;
          _this.durationSelector = durationSelector;
          _this.hasValue = false;
          return _this;
      }
      AuditSubscriber.prototype._next = function (value) {
          this.value = value;
          this.hasValue = true;
          if (!this.throttled) {
              var duration = tryCatch(this.durationSelector)(value);
              if (duration === errorObject) {
                  this.destination.error(errorObject.e);
              }
              else {
                  var innerSubscription = subscribeToResult(this, duration);
                  if (!innerSubscription || innerSubscription.closed) {
                      this.clearThrottle();
                  }
                  else {
                      this.add(this.throttled = innerSubscription);
                  }
              }
          }
      };
      AuditSubscriber.prototype.clearThrottle = function () {
          var _a = this, value = _a.value, hasValue = _a.hasValue, throttled = _a.throttled;
          if (throttled) {
              this.remove(throttled);
              this.throttled = null;
              throttled.unsubscribe();
          }
          if (hasValue) {
              this.value = null;
              this.hasValue = false;
              this.destination.next(value);
          }
      };
      AuditSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex) {
          this.clearThrottle();
      };
      AuditSubscriber.prototype.notifyComplete = function () {
          this.clearThrottle();
      };
      return AuditSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=audit.js.map

  /** PURE_IMPORTS_START _scheduler_async,_audit,_observable_timer PURE_IMPORTS_END */
  //# sourceMappingURL=auditTime.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var BufferSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(BufferSubscriber, _super);
      function BufferSubscriber(destination, closingNotifier) {
          var _this = _super.call(this, destination) || this;
          _this.buffer = [];
          _this.add(subscribeToResult(_this, closingNotifier));
          return _this;
      }
      BufferSubscriber.prototype._next = function (value) {
          this.buffer.push(value);
      };
      BufferSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          var buffer = this.buffer;
          this.buffer = [];
          this.destination.next(buffer);
      };
      return BufferSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=buffer.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var BufferCountSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(BufferCountSubscriber, _super);
      function BufferCountSubscriber(destination, bufferSize) {
          var _this = _super.call(this, destination) || this;
          _this.bufferSize = bufferSize;
          _this.buffer = [];
          return _this;
      }
      BufferCountSubscriber.prototype._next = function (value) {
          var buffer = this.buffer;
          buffer.push(value);
          if (buffer.length == this.bufferSize) {
              this.destination.next(buffer);
              this.buffer = [];
          }
      };
      BufferCountSubscriber.prototype._complete = function () {
          var buffer = this.buffer;
          if (buffer.length > 0) {
              this.destination.next(buffer);
          }
          _super.prototype._complete.call(this);
      };
      return BufferCountSubscriber;
  }(Subscriber));
  var BufferSkipCountSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(BufferSkipCountSubscriber, _super);
      function BufferSkipCountSubscriber(destination, bufferSize, startBufferEvery) {
          var _this = _super.call(this, destination) || this;
          _this.bufferSize = bufferSize;
          _this.startBufferEvery = startBufferEvery;
          _this.buffers = [];
          _this.count = 0;
          return _this;
      }
      BufferSkipCountSubscriber.prototype._next = function (value) {
          var _a = this, bufferSize = _a.bufferSize, startBufferEvery = _a.startBufferEvery, buffers = _a.buffers, count = _a.count;
          this.count++;
          if (count % startBufferEvery === 0) {
              buffers.push([]);
          }
          for (var i = buffers.length; i--;) {
              var buffer = buffers[i];
              buffer.push(value);
              if (buffer.length === bufferSize) {
                  buffers.splice(i, 1);
                  this.destination.next(buffer);
              }
          }
      };
      BufferSkipCountSubscriber.prototype._complete = function () {
          var _a = this, buffers = _a.buffers, destination = _a.destination;
          while (buffers.length > 0) {
              var buffer = buffers.shift();
              if (buffer.length > 0) {
                  destination.next(buffer);
              }
          }
          _super.prototype._complete.call(this);
      };
      return BufferSkipCountSubscriber;
  }(Subscriber));
  //# sourceMappingURL=bufferCount.js.map

  /** PURE_IMPORTS_START tslib,_scheduler_async,_Subscriber,_util_isScheduler PURE_IMPORTS_END */
  var Context = /*@__PURE__*/ (function () {
      function Context() {
          this.buffer = [];
      }
      return Context;
  }());
  var BufferTimeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(BufferTimeSubscriber, _super);
      function BufferTimeSubscriber(destination, bufferTimeSpan, bufferCreationInterval, maxBufferSize, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.bufferTimeSpan = bufferTimeSpan;
          _this.bufferCreationInterval = bufferCreationInterval;
          _this.maxBufferSize = maxBufferSize;
          _this.scheduler = scheduler;
          _this.contexts = [];
          var context = _this.openContext();
          _this.timespanOnly = bufferCreationInterval == null || bufferCreationInterval < 0;
          if (_this.timespanOnly) {
              var timeSpanOnlyState = { subscriber: _this, context: context, bufferTimeSpan: bufferTimeSpan };
              _this.add(context.closeAction = scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
          }
          else {
              var closeState = { subscriber: _this, context: context };
              var creationState = { bufferTimeSpan: bufferTimeSpan, bufferCreationInterval: bufferCreationInterval, subscriber: _this, scheduler: scheduler };
              _this.add(context.closeAction = scheduler.schedule(dispatchBufferClose, bufferTimeSpan, closeState));
              _this.add(scheduler.schedule(dispatchBufferCreation, bufferCreationInterval, creationState));
          }
          return _this;
      }
      BufferTimeSubscriber.prototype._next = function (value) {
          var contexts = this.contexts;
          var len = contexts.length;
          var filledBufferContext;
          for (var i = 0; i < len; i++) {
              var context_1 = contexts[i];
              var buffer = context_1.buffer;
              buffer.push(value);
              if (buffer.length == this.maxBufferSize) {
                  filledBufferContext = context_1;
              }
          }
          if (filledBufferContext) {
              this.onBufferFull(filledBufferContext);
          }
      };
      BufferTimeSubscriber.prototype._error = function (err) {
          this.contexts.length = 0;
          _super.prototype._error.call(this, err);
      };
      BufferTimeSubscriber.prototype._complete = function () {
          var _a = this, contexts = _a.contexts, destination = _a.destination;
          while (contexts.length > 0) {
              var context_2 = contexts.shift();
              destination.next(context_2.buffer);
          }
          _super.prototype._complete.call(this);
      };
      BufferTimeSubscriber.prototype._unsubscribe = function () {
          this.contexts = null;
      };
      BufferTimeSubscriber.prototype.onBufferFull = function (context) {
          this.closeContext(context);
          var closeAction = context.closeAction;
          closeAction.unsubscribe();
          this.remove(closeAction);
          if (!this.closed && this.timespanOnly) {
              context = this.openContext();
              var bufferTimeSpan = this.bufferTimeSpan;
              var timeSpanOnlyState = { subscriber: this, context: context, bufferTimeSpan: bufferTimeSpan };
              this.add(context.closeAction = this.scheduler.schedule(dispatchBufferTimeSpanOnly, bufferTimeSpan, timeSpanOnlyState));
          }
      };
      BufferTimeSubscriber.prototype.openContext = function () {
          var context = new Context();
          this.contexts.push(context);
          return context;
      };
      BufferTimeSubscriber.prototype.closeContext = function (context) {
          this.destination.next(context.buffer);
          var contexts = this.contexts;
          var spliceIndex = contexts ? contexts.indexOf(context) : -1;
          if (spliceIndex >= 0) {
              contexts.splice(contexts.indexOf(context), 1);
          }
      };
      return BufferTimeSubscriber;
  }(Subscriber));
  function dispatchBufferTimeSpanOnly(state) {
      var subscriber = state.subscriber;
      var prevContext = state.context;
      if (prevContext) {
          subscriber.closeContext(prevContext);
      }
      if (!subscriber.closed) {
          state.context = subscriber.openContext();
          state.context.closeAction = this.schedule(state, state.bufferTimeSpan);
      }
  }
  function dispatchBufferCreation(state) {
      var bufferCreationInterval = state.bufferCreationInterval, bufferTimeSpan = state.bufferTimeSpan, subscriber = state.subscriber, scheduler = state.scheduler;
      var context = subscriber.openContext();
      var action = this;
      if (!subscriber.closed) {
          subscriber.add(context.closeAction = scheduler.schedule(dispatchBufferClose, bufferTimeSpan, { subscriber: subscriber, context: context }));
          action.schedule(state, bufferCreationInterval);
      }
  }
  function dispatchBufferClose(arg) {
      var subscriber = arg.subscriber, context = arg.context;
      subscriber.closeContext(context);
  }
  //# sourceMappingURL=bufferTime.js.map

  /** PURE_IMPORTS_START tslib,_Subscription,_util_subscribeToResult,_OuterSubscriber PURE_IMPORTS_END */
  var BufferToggleSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(BufferToggleSubscriber, _super);
      function BufferToggleSubscriber(destination, openings, closingSelector) {
          var _this = _super.call(this, destination) || this;
          _this.openings = openings;
          _this.closingSelector = closingSelector;
          _this.contexts = [];
          _this.add(subscribeToResult(_this, openings));
          return _this;
      }
      BufferToggleSubscriber.prototype._next = function (value) {
          var contexts = this.contexts;
          var len = contexts.length;
          for (var i = 0; i < len; i++) {
              contexts[i].buffer.push(value);
          }
      };
      BufferToggleSubscriber.prototype._error = function (err) {
          var contexts = this.contexts;
          while (contexts.length > 0) {
              var context_1 = contexts.shift();
              context_1.subscription.unsubscribe();
              context_1.buffer = null;
              context_1.subscription = null;
          }
          this.contexts = null;
          _super.prototype._error.call(this, err);
      };
      BufferToggleSubscriber.prototype._complete = function () {
          var contexts = this.contexts;
          while (contexts.length > 0) {
              var context_2 = contexts.shift();
              this.destination.next(context_2.buffer);
              context_2.subscription.unsubscribe();
              context_2.buffer = null;
              context_2.subscription = null;
          }
          this.contexts = null;
          _super.prototype._complete.call(this);
      };
      BufferToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          outerValue ? this.closeBuffer(outerValue) : this.openBuffer(innerValue);
      };
      BufferToggleSubscriber.prototype.notifyComplete = function (innerSub) {
          this.closeBuffer(innerSub.context);
      };
      BufferToggleSubscriber.prototype.openBuffer = function (value) {
          try {
              var closingSelector = this.closingSelector;
              var closingNotifier = closingSelector.call(this, value);
              if (closingNotifier) {
                  this.trySubscribe(closingNotifier);
              }
          }
          catch (err) {
              this._error(err);
          }
      };
      BufferToggleSubscriber.prototype.closeBuffer = function (context) {
          var contexts = this.contexts;
          if (contexts && context) {
              var buffer = context.buffer, subscription = context.subscription;
              this.destination.next(buffer);
              contexts.splice(contexts.indexOf(context), 1);
              this.remove(subscription);
              subscription.unsubscribe();
          }
      };
      BufferToggleSubscriber.prototype.trySubscribe = function (closingNotifier) {
          var contexts = this.contexts;
          var buffer = [];
          var subscription = new Subscription();
          var context = { buffer: buffer, subscription: subscription };
          contexts.push(context);
          var innerSubscription = subscribeToResult(this, closingNotifier, context);
          if (!innerSubscription || innerSubscription.closed) {
              this.closeBuffer(context);
          }
          else {
              innerSubscription.context = context;
              this.add(innerSubscription);
              subscription.add(innerSubscription);
          }
      };
      return BufferToggleSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=bufferToggle.js.map

  /** PURE_IMPORTS_START tslib,_Subscription,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var BufferWhenSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(BufferWhenSubscriber, _super);
      function BufferWhenSubscriber(destination, closingSelector) {
          var _this = _super.call(this, destination) || this;
          _this.closingSelector = closingSelector;
          _this.subscribing = false;
          _this.openBuffer();
          return _this;
      }
      BufferWhenSubscriber.prototype._next = function (value) {
          this.buffer.push(value);
      };
      BufferWhenSubscriber.prototype._complete = function () {
          var buffer = this.buffer;
          if (buffer) {
              this.destination.next(buffer);
          }
          _super.prototype._complete.call(this);
      };
      BufferWhenSubscriber.prototype._unsubscribe = function () {
          this.buffer = null;
          this.subscribing = false;
      };
      BufferWhenSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.openBuffer();
      };
      BufferWhenSubscriber.prototype.notifyComplete = function () {
          if (this.subscribing) {
              this.complete();
          }
          else {
              this.openBuffer();
          }
      };
      BufferWhenSubscriber.prototype.openBuffer = function () {
          var closingSubscription = this.closingSubscription;
          if (closingSubscription) {
              this.remove(closingSubscription);
              closingSubscription.unsubscribe();
          }
          var buffer = this.buffer;
          if (this.buffer) {
              this.destination.next(buffer);
          }
          this.buffer = [];
          var closingNotifier = tryCatch(this.closingSelector)();
          if (closingNotifier === errorObject) {
              this.error(errorObject.e);
          }
          else {
              closingSubscription = new Subscription();
              this.closingSubscription = closingSubscription;
              this.add(closingSubscription);
              this.subscribing = true;
              closingSubscription.add(subscribeToResult(this, closingNotifier));
              this.subscribing = false;
          }
      };
      return BufferWhenSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=bufferWhen.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_InnerSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var CatchSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(CatchSubscriber, _super);
      function CatchSubscriber(destination, selector, caught) {
          var _this = _super.call(this, destination) || this;
          _this.selector = selector;
          _this.caught = caught;
          return _this;
      }
      CatchSubscriber.prototype.error = function (err) {
          if (!this.isStopped) {
              var result = void 0;
              try {
                  result = this.selector(err, this.caught);
              }
              catch (err2) {
                  _super.prototype.error.call(this, err2);
                  return;
              }
              this._unsubscribeAndRecycle();
              var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
              this.add(innerSubscriber);
              subscribeToResult(this, result, undefined, undefined, innerSubscriber);
          }
      };
      return CatchSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=catchError.js.map

  /** PURE_IMPORTS_START _observable_combineLatest PURE_IMPORTS_END */
  //# sourceMappingURL=combineAll.js.map

  /** PURE_IMPORTS_START _util_isArray,_observable_combineLatest,_observable_from PURE_IMPORTS_END */
  //# sourceMappingURL=combineLatest.js.map

  /** PURE_IMPORTS_START _observable_concat PURE_IMPORTS_END */
  //# sourceMappingURL=concat.js.map

  /** PURE_IMPORTS_START _mergeMap PURE_IMPORTS_END */
  //# sourceMappingURL=concatMap.js.map

  /** PURE_IMPORTS_START _concatMap PURE_IMPORTS_END */
  //# sourceMappingURL=concatMapTo.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var CountSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(CountSubscriber, _super);
      function CountSubscriber(destination, predicate, source) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.source = source;
          _this.count = 0;
          _this.index = 0;
          return _this;
      }
      CountSubscriber.prototype._next = function (value) {
          if (this.predicate) {
              this._tryPredicate(value);
          }
          else {
              this.count++;
          }
      };
      CountSubscriber.prototype._tryPredicate = function (value) {
          var result;
          try {
              result = this.predicate(value, this.index++, this.source);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          if (result) {
              this.count++;
          }
      };
      CountSubscriber.prototype._complete = function () {
          this.destination.next(this.count);
          this.destination.complete();
      };
      return CountSubscriber;
  }(Subscriber));
  //# sourceMappingURL=count.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var DebounceSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DebounceSubscriber, _super);
      function DebounceSubscriber(destination, durationSelector) {
          var _this = _super.call(this, destination) || this;
          _this.durationSelector = durationSelector;
          _this.hasValue = false;
          _this.durationSubscription = null;
          return _this;
      }
      DebounceSubscriber.prototype._next = function (value) {
          try {
              var result = this.durationSelector.call(this, value);
              if (result) {
                  this._tryNext(value, result);
              }
          }
          catch (err) {
              this.destination.error(err);
          }
      };
      DebounceSubscriber.prototype._complete = function () {
          this.emitValue();
          this.destination.complete();
      };
      DebounceSubscriber.prototype._tryNext = function (value, duration) {
          var subscription = this.durationSubscription;
          this.value = value;
          this.hasValue = true;
          if (subscription) {
              subscription.unsubscribe();
              this.remove(subscription);
          }
          subscription = subscribeToResult(this, duration);
          if (subscription && !subscription.closed) {
              this.add(this.durationSubscription = subscription);
          }
      };
      DebounceSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.emitValue();
      };
      DebounceSubscriber.prototype.notifyComplete = function () {
          this.emitValue();
      };
      DebounceSubscriber.prototype.emitValue = function () {
          if (this.hasValue) {
              var value = this.value;
              var subscription = this.durationSubscription;
              if (subscription) {
                  this.durationSubscription = null;
                  subscription.unsubscribe();
                  this.remove(subscription);
              }
              this.value = null;
              this.hasValue = false;
              _super.prototype._next.call(this, value);
          }
      };
      return DebounceSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=debounce.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async PURE_IMPORTS_END */
  var DebounceTimeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DebounceTimeSubscriber, _super);
      function DebounceTimeSubscriber(destination, dueTime, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.dueTime = dueTime;
          _this.scheduler = scheduler;
          _this.debouncedSubscription = null;
          _this.lastValue = null;
          _this.hasValue = false;
          return _this;
      }
      DebounceTimeSubscriber.prototype._next = function (value) {
          this.clearDebounce();
          this.lastValue = value;
          this.hasValue = true;
          this.add(this.debouncedSubscription = this.scheduler.schedule(dispatchNext$2, this.dueTime, this));
      };
      DebounceTimeSubscriber.prototype._complete = function () {
          this.debouncedNext();
          this.destination.complete();
      };
      DebounceTimeSubscriber.prototype.debouncedNext = function () {
          this.clearDebounce();
          if (this.hasValue) {
              var lastValue = this.lastValue;
              this.lastValue = null;
              this.hasValue = false;
              this.destination.next(lastValue);
          }
      };
      DebounceTimeSubscriber.prototype.clearDebounce = function () {
          var debouncedSubscription = this.debouncedSubscription;
          if (debouncedSubscription !== null) {
              this.remove(debouncedSubscription);
              debouncedSubscription.unsubscribe();
              this.debouncedSubscription = null;
          }
      };
      return DebounceTimeSubscriber;
  }(Subscriber));
  function dispatchNext$2(subscriber) {
      subscriber.debouncedNext();
  }
  //# sourceMappingURL=debounceTime.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var DefaultIfEmptySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DefaultIfEmptySubscriber, _super);
      function DefaultIfEmptySubscriber(destination, defaultValue) {
          var _this = _super.call(this, destination) || this;
          _this.defaultValue = defaultValue;
          _this.isEmpty = true;
          return _this;
      }
      DefaultIfEmptySubscriber.prototype._next = function (value) {
          this.isEmpty = false;
          this.destination.next(value);
      };
      DefaultIfEmptySubscriber.prototype._complete = function () {
          if (this.isEmpty) {
              this.destination.next(this.defaultValue);
          }
          this.destination.complete();
      };
      return DefaultIfEmptySubscriber;
  }(Subscriber));
  //# sourceMappingURL=defaultIfEmpty.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  //# sourceMappingURL=isDate.js.map

  /** PURE_IMPORTS_START tslib,_scheduler_async,_util_isDate,_Subscriber,_Notification PURE_IMPORTS_END */
  var DelaySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DelaySubscriber, _super);
      function DelaySubscriber(destination, delay, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.delay = delay;
          _this.scheduler = scheduler;
          _this.queue = [];
          _this.active = false;
          _this.errored = false;
          return _this;
      }
      DelaySubscriber.dispatch = function (state) {
          var source = state.source;
          var queue = source.queue;
          var scheduler = state.scheduler;
          var destination = state.destination;
          while (queue.length > 0 && (queue[0].time - scheduler.now()) <= 0) {
              queue.shift().notification.observe(destination);
          }
          if (queue.length > 0) {
              var delay_1 = Math.max(0, queue[0].time - scheduler.now());
              this.schedule(state, delay_1);
          }
          else {
              this.unsubscribe();
              source.active = false;
          }
      };
      DelaySubscriber.prototype._schedule = function (scheduler) {
          this.active = true;
          var destination = this.destination;
          destination.add(scheduler.schedule(DelaySubscriber.dispatch, this.delay, {
              source: this, destination: this.destination, scheduler: scheduler
          }));
      };
      DelaySubscriber.prototype.scheduleNotification = function (notification) {
          if (this.errored === true) {
              return;
          }
          var scheduler = this.scheduler;
          var message = new DelayMessage(scheduler.now() + this.delay, notification);
          this.queue.push(message);
          if (this.active === false) {
              this._schedule(scheduler);
          }
      };
      DelaySubscriber.prototype._next = function (value) {
          this.scheduleNotification(Notification.createNext(value));
      };
      DelaySubscriber.prototype._error = function (err) {
          this.errored = true;
          this.queue = [];
          this.destination.error(err);
          this.unsubscribe();
      };
      DelaySubscriber.prototype._complete = function () {
          this.scheduleNotification(Notification.createComplete());
          this.unsubscribe();
      };
      return DelaySubscriber;
  }(Subscriber));
  var DelayMessage = /*@__PURE__*/ (function () {
      function DelayMessage(time, notification) {
          this.time = time;
          this.notification = notification;
      }
      return DelayMessage;
  }());
  //# sourceMappingURL=delay.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_Observable,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var DelayWhenSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DelayWhenSubscriber, _super);
      function DelayWhenSubscriber(destination, delayDurationSelector) {
          var _this = _super.call(this, destination) || this;
          _this.delayDurationSelector = delayDurationSelector;
          _this.completed = false;
          _this.delayNotifierSubscriptions = [];
          _this.index = 0;
          return _this;
      }
      DelayWhenSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.destination.next(outerValue);
          this.removeSubscription(innerSub);
          this.tryComplete();
      };
      DelayWhenSubscriber.prototype.notifyError = function (error, innerSub) {
          this._error(error);
      };
      DelayWhenSubscriber.prototype.notifyComplete = function (innerSub) {
          var value = this.removeSubscription(innerSub);
          if (value) {
              this.destination.next(value);
          }
          this.tryComplete();
      };
      DelayWhenSubscriber.prototype._next = function (value) {
          var index = this.index++;
          try {
              var delayNotifier = this.delayDurationSelector(value, index);
              if (delayNotifier) {
                  this.tryDelay(delayNotifier, value);
              }
          }
          catch (err) {
              this.destination.error(err);
          }
      };
      DelayWhenSubscriber.prototype._complete = function () {
          this.completed = true;
          this.tryComplete();
          this.unsubscribe();
      };
      DelayWhenSubscriber.prototype.removeSubscription = function (subscription) {
          subscription.unsubscribe();
          var subscriptionIdx = this.delayNotifierSubscriptions.indexOf(subscription);
          if (subscriptionIdx !== -1) {
              this.delayNotifierSubscriptions.splice(subscriptionIdx, 1);
          }
          return subscription.outerValue;
      };
      DelayWhenSubscriber.prototype.tryDelay = function (delayNotifier, value) {
          var notifierSubscription = subscribeToResult(this, delayNotifier, value);
          if (notifierSubscription && !notifierSubscription.closed) {
              var destination = this.destination;
              destination.add(notifierSubscription);
              this.delayNotifierSubscriptions.push(notifierSubscription);
          }
      };
      DelayWhenSubscriber.prototype.tryComplete = function () {
          if (this.completed && this.delayNotifierSubscriptions.length === 0) {
              this.destination.complete();
          }
      };
      return DelayWhenSubscriber;
  }(OuterSubscriber));
  var SubscriptionDelayObservable = /*@__PURE__*/ (function (_super) {
      __extends(SubscriptionDelayObservable, _super);
      function SubscriptionDelayObservable(source, subscriptionDelay) {
          var _this = _super.call(this) || this;
          _this.source = source;
          _this.subscriptionDelay = subscriptionDelay;
          return _this;
      }
      SubscriptionDelayObservable.prototype._subscribe = function (subscriber) {
          this.subscriptionDelay.subscribe(new SubscriptionDelaySubscriber(subscriber, this.source));
      };
      return SubscriptionDelayObservable;
  }(Observable));
  var SubscriptionDelaySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SubscriptionDelaySubscriber, _super);
      function SubscriptionDelaySubscriber(parent, source) {
          var _this = _super.call(this) || this;
          _this.parent = parent;
          _this.source = source;
          _this.sourceSubscribed = false;
          return _this;
      }
      SubscriptionDelaySubscriber.prototype._next = function (unused) {
          this.subscribeToSource();
      };
      SubscriptionDelaySubscriber.prototype._error = function (err) {
          this.unsubscribe();
          this.parent.error(err);
      };
      SubscriptionDelaySubscriber.prototype._complete = function () {
          this.unsubscribe();
          this.subscribeToSource();
      };
      SubscriptionDelaySubscriber.prototype.subscribeToSource = function () {
          if (!this.sourceSubscribed) {
              this.sourceSubscribed = true;
              this.unsubscribe();
              this.source.subscribe(this.parent);
          }
      };
      return SubscriptionDelaySubscriber;
  }(Subscriber));
  //# sourceMappingURL=delayWhen.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var DeMaterializeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DeMaterializeSubscriber, _super);
      function DeMaterializeSubscriber(destination) {
          return _super.call(this, destination) || this;
      }
      DeMaterializeSubscriber.prototype._next = function (value) {
          value.observe(this.destination);
      };
      return DeMaterializeSubscriber;
  }(Subscriber));
  //# sourceMappingURL=dematerialize.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var DistinctSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DistinctSubscriber, _super);
      function DistinctSubscriber(destination, keySelector, flushes) {
          var _this = _super.call(this, destination) || this;
          _this.keySelector = keySelector;
          _this.values = new Set();
          if (flushes) {
              _this.add(subscribeToResult(_this, flushes));
          }
          return _this;
      }
      DistinctSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.values.clear();
      };
      DistinctSubscriber.prototype.notifyError = function (error, innerSub) {
          this._error(error);
      };
      DistinctSubscriber.prototype._next = function (value) {
          if (this.keySelector) {
              this._useKeySelector(value);
          }
          else {
              this._finalizeNext(value, value);
          }
      };
      DistinctSubscriber.prototype._useKeySelector = function (value) {
          var key;
          var destination = this.destination;
          try {
              key = this.keySelector(value);
          }
          catch (err) {
              destination.error(err);
              return;
          }
          this._finalizeNext(key, value);
      };
      DistinctSubscriber.prototype._finalizeNext = function (key, value) {
          var values = this.values;
          if (!values.has(key)) {
              values.add(key);
              this.destination.next(value);
          }
      };
      return DistinctSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=distinct.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_tryCatch,_util_errorObject PURE_IMPORTS_END */
  var DistinctUntilChangedSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(DistinctUntilChangedSubscriber, _super);
      function DistinctUntilChangedSubscriber(destination, compare, keySelector) {
          var _this = _super.call(this, destination) || this;
          _this.keySelector = keySelector;
          _this.hasKey = false;
          if (typeof compare === 'function') {
              _this.compare = compare;
          }
          return _this;
      }
      DistinctUntilChangedSubscriber.prototype.compare = function (x, y) {
          return x === y;
      };
      DistinctUntilChangedSubscriber.prototype._next = function (value) {
          var keySelector = this.keySelector;
          var key = value;
          if (keySelector) {
              key = tryCatch(this.keySelector)(value);
              if (key === errorObject) {
                  return this.destination.error(errorObject.e);
              }
          }
          var result = false;
          if (this.hasKey) {
              result = tryCatch(this.compare)(this.key, key);
              if (result === errorObject) {
                  return this.destination.error(errorObject.e);
              }
          }
          else {
              this.hasKey = true;
          }
          if (Boolean(result) === false) {
              this.key = key;
              this.destination.next(value);
          }
      };
      return DistinctUntilChangedSubscriber;
  }(Subscriber));
  //# sourceMappingURL=distinctUntilChanged.js.map

  /** PURE_IMPORTS_START _distinctUntilChanged PURE_IMPORTS_END */
  //# sourceMappingURL=distinctUntilKeyChanged.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  function filter(predicate, thisArg) {
      return function filterOperatorFunction(source) {
          return source.lift(new FilterOperator(predicate, thisArg));
      };
  }
  var FilterOperator = /*@__PURE__*/ (function () {
      function FilterOperator(predicate, thisArg) {
          this.predicate = predicate;
          this.thisArg = thisArg;
      }
      FilterOperator.prototype.call = function (subscriber, source) {
          return source.subscribe(new FilterSubscriber(subscriber, this.predicate, this.thisArg));
      };
      return FilterOperator;
  }());
  var FilterSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(FilterSubscriber, _super);
      function FilterSubscriber(destination, predicate, thisArg) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.thisArg = thisArg;
          _this.count = 0;
          return _this;
      }
      FilterSubscriber.prototype._next = function (value) {
          var result;
          try {
              result = this.predicate.call(this.thisArg, value, this.count++);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          if (result) {
              this.destination.next(value);
          }
      };
      return FilterSubscriber;
  }(Subscriber));
  //# sourceMappingURL=filter.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_noop,_util_isFunction PURE_IMPORTS_END */
  function tap(nextOrObserver, error, complete) {
      return function tapOperatorFunction(source) {
          return source.lift(new DoOperator(nextOrObserver, error, complete));
      };
  }
  var DoOperator = /*@__PURE__*/ (function () {
      function DoOperator(nextOrObserver, error, complete) {
          this.nextOrObserver = nextOrObserver;
          this.error = error;
          this.complete = complete;
      }
      DoOperator.prototype.call = function (subscriber, source) {
          return source.subscribe(new TapSubscriber(subscriber, this.nextOrObserver, this.error, this.complete));
      };
      return DoOperator;
  }());
  var TapSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(TapSubscriber, _super);
      function TapSubscriber(destination, observerOrNext, error, complete) {
          var _this = _super.call(this, destination) || this;
          _this._tapNext = noop;
          _this._tapError = noop;
          _this._tapComplete = noop;
          _this._tapError = error || noop;
          _this._tapComplete = complete || noop;
          if (isFunction$1(observerOrNext)) {
              _this._context = _this;
              _this._tapNext = observerOrNext;
          }
          else if (observerOrNext) {
              _this._context = observerOrNext;
              _this._tapNext = observerOrNext.next || noop;
              _this._tapError = observerOrNext.error || noop;
              _this._tapComplete = observerOrNext.complete || noop;
          }
          return _this;
      }
      TapSubscriber.prototype._next = function (value) {
          try {
              this._tapNext.call(this._context, value);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.destination.next(value);
      };
      TapSubscriber.prototype._error = function (err) {
          try {
              this._tapError.call(this._context, err);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.destination.error(err);
      };
      TapSubscriber.prototype._complete = function () {
          try {
              this._tapComplete.call(this._context);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          return this.destination.complete();
      };
      return TapSubscriber;
  }(Subscriber));
  //# sourceMappingURL=tap.js.map

  /** PURE_IMPORTS_START _tap,_util_EmptyError PURE_IMPORTS_END */
  //# sourceMappingURL=throwIfEmpty.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError,_observable_empty PURE_IMPORTS_END */
  function take(count) {
      return function (source) {
          if (count === 0) {
              return empty$1();
          }
          else {
              return source.lift(new TakeOperator(count));
          }
      };
  }
  var TakeOperator = /*@__PURE__*/ (function () {
      function TakeOperator(total) {
          this.total = total;
          if (this.total < 0) {
              throw new ArgumentOutOfRangeError;
          }
      }
      TakeOperator.prototype.call = function (subscriber, source) {
          return source.subscribe(new TakeSubscriber(subscriber, this.total));
      };
      return TakeOperator;
  }());
  var TakeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(TakeSubscriber, _super);
      function TakeSubscriber(destination, total) {
          var _this = _super.call(this, destination) || this;
          _this.total = total;
          _this.count = 0;
          return _this;
      }
      TakeSubscriber.prototype._next = function (value) {
          var total = this.total;
          var count = ++this.count;
          if (count <= total) {
              this.destination.next(value);
              if (count === total) {
                  this.destination.complete();
                  this.unsubscribe();
              }
          }
      };
      return TakeSubscriber;
  }(Subscriber));
  //# sourceMappingURL=take.js.map

  /** PURE_IMPORTS_START _util_ArgumentOutOfRangeError,_filter,_throwIfEmpty,_defaultIfEmpty,_take PURE_IMPORTS_END */
  //# sourceMappingURL=elementAt.js.map

  /** PURE_IMPORTS_START _observable_fromArray,_observable_scalar,_observable_empty,_observable_concat,_util_isScheduler PURE_IMPORTS_END */
  //# sourceMappingURL=endWith.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var EverySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(EverySubscriber, _super);
      function EverySubscriber(destination, predicate, thisArg, source) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.thisArg = thisArg;
          _this.source = source;
          _this.index = 0;
          _this.thisArg = thisArg || _this;
          return _this;
      }
      EverySubscriber.prototype.notifyComplete = function (everyValueMatch) {
          this.destination.next(everyValueMatch);
          this.destination.complete();
      };
      EverySubscriber.prototype._next = function (value) {
          var result = false;
          try {
              result = this.predicate.call(this.thisArg, value, this.index++, this.source);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          if (!result) {
              this.notifyComplete(false);
          }
      };
      EverySubscriber.prototype._complete = function () {
          this.notifyComplete(true);
      };
      return EverySubscriber;
  }(Subscriber));
  //# sourceMappingURL=every.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var SwitchFirstSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SwitchFirstSubscriber, _super);
      function SwitchFirstSubscriber(destination) {
          var _this = _super.call(this, destination) || this;
          _this.hasCompleted = false;
          _this.hasSubscription = false;
          return _this;
      }
      SwitchFirstSubscriber.prototype._next = function (value) {
          if (!this.hasSubscription) {
              this.hasSubscription = true;
              this.add(subscribeToResult(this, value));
          }
      };
      SwitchFirstSubscriber.prototype._complete = function () {
          this.hasCompleted = true;
          if (!this.hasSubscription) {
              this.destination.complete();
          }
      };
      SwitchFirstSubscriber.prototype.notifyComplete = function (innerSub) {
          this.remove(innerSub);
          this.hasSubscription = false;
          if (this.hasCompleted) {
              this.destination.complete();
          }
      };
      return SwitchFirstSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=exhaust.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_InnerSubscriber,_util_subscribeToResult,_map,_observable_from PURE_IMPORTS_END */
  var ExhaustMapSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ExhaustMapSubscriber, _super);
      function ExhaustMapSubscriber(destination, project) {
          var _this = _super.call(this, destination) || this;
          _this.project = project;
          _this.hasSubscription = false;
          _this.hasCompleted = false;
          _this.index = 0;
          return _this;
      }
      ExhaustMapSubscriber.prototype._next = function (value) {
          if (!this.hasSubscription) {
              this.tryNext(value);
          }
      };
      ExhaustMapSubscriber.prototype.tryNext = function (value) {
          var result;
          var index = this.index++;
          try {
              result = this.project(value, index);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.hasSubscription = true;
          this._innerSub(result, value, index);
      };
      ExhaustMapSubscriber.prototype._innerSub = function (result, value, index) {
          var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
          var destination = this.destination;
          destination.add(innerSubscriber);
          subscribeToResult(this, result, value, index, innerSubscriber);
      };
      ExhaustMapSubscriber.prototype._complete = function () {
          this.hasCompleted = true;
          if (!this.hasSubscription) {
              this.destination.complete();
          }
          this.unsubscribe();
      };
      ExhaustMapSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.destination.next(innerValue);
      };
      ExhaustMapSubscriber.prototype.notifyError = function (err) {
          this.destination.error(err);
      };
      ExhaustMapSubscriber.prototype.notifyComplete = function (innerSub) {
          var destination = this.destination;
          destination.remove(innerSub);
          this.hasSubscription = false;
          if (this.hasCompleted) {
              this.destination.complete();
          }
      };
      return ExhaustMapSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=exhaustMap.js.map

  /** PURE_IMPORTS_START tslib,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var ExpandSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ExpandSubscriber, _super);
      function ExpandSubscriber(destination, project, concurrent, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.project = project;
          _this.concurrent = concurrent;
          _this.scheduler = scheduler;
          _this.index = 0;
          _this.active = 0;
          _this.hasCompleted = false;
          if (concurrent < Number.POSITIVE_INFINITY) {
              _this.buffer = [];
          }
          return _this;
      }
      ExpandSubscriber.dispatch = function (arg) {
          var subscriber = arg.subscriber, result = arg.result, value = arg.value, index = arg.index;
          subscriber.subscribeToProjection(result, value, index);
      };
      ExpandSubscriber.prototype._next = function (value) {
          var destination = this.destination;
          if (destination.closed) {
              this._complete();
              return;
          }
          var index = this.index++;
          if (this.active < this.concurrent) {
              destination.next(value);
              var result = tryCatch(this.project)(value, index);
              if (result === errorObject) {
                  destination.error(errorObject.e);
              }
              else if (!this.scheduler) {
                  this.subscribeToProjection(result, value, index);
              }
              else {
                  var state = { subscriber: this, result: result, value: value, index: index };
                  var destination_1 = this.destination;
                  destination_1.add(this.scheduler.schedule(ExpandSubscriber.dispatch, 0, state));
              }
          }
          else {
              this.buffer.push(value);
          }
      };
      ExpandSubscriber.prototype.subscribeToProjection = function (result, value, index) {
          this.active++;
          var destination = this.destination;
          destination.add(subscribeToResult(this, result, value, index));
      };
      ExpandSubscriber.prototype._complete = function () {
          this.hasCompleted = true;
          if (this.hasCompleted && this.active === 0) {
              this.destination.complete();
          }
          this.unsubscribe();
      };
      ExpandSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this._next(innerValue);
      };
      ExpandSubscriber.prototype.notifyComplete = function (innerSub) {
          var buffer = this.buffer;
          var destination = this.destination;
          destination.remove(innerSub);
          this.active--;
          if (buffer && buffer.length > 0) {
              this._next(buffer.shift());
          }
          if (this.hasCompleted && this.active === 0) {
              this.destination.complete();
          }
      };
      return ExpandSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=expand.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_Subscription PURE_IMPORTS_END */
  var FinallySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(FinallySubscriber, _super);
      function FinallySubscriber(destination, callback) {
          var _this = _super.call(this, destination) || this;
          _this.add(new Subscription(callback));
          return _this;
      }
      return FinallySubscriber;
  }(Subscriber));
  //# sourceMappingURL=finalize.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var FindValueSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(FindValueSubscriber, _super);
      function FindValueSubscriber(destination, predicate, source, yieldIndex, thisArg) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.source = source;
          _this.yieldIndex = yieldIndex;
          _this.thisArg = thisArg;
          _this.index = 0;
          return _this;
      }
      FindValueSubscriber.prototype.notifyComplete = function (value) {
          var destination = this.destination;
          destination.next(value);
          destination.complete();
          this.unsubscribe();
      };
      FindValueSubscriber.prototype._next = function (value) {
          var _a = this, predicate = _a.predicate, thisArg = _a.thisArg;
          var index = this.index++;
          try {
              var result = predicate.call(thisArg || this, value, index, this.source);
              if (result) {
                  this.notifyComplete(this.yieldIndex ? index : value);
              }
          }
          catch (err) {
              this.destination.error(err);
          }
      };
      FindValueSubscriber.prototype._complete = function () {
          this.notifyComplete(this.yieldIndex ? -1 : undefined);
      };
      return FindValueSubscriber;
  }(Subscriber));
  //# sourceMappingURL=find.js.map

  /** PURE_IMPORTS_START _operators_find PURE_IMPORTS_END */
  //# sourceMappingURL=findIndex.js.map

  /** PURE_IMPORTS_START _util_EmptyError,_filter,_take,_defaultIfEmpty,_throwIfEmpty,_util_identity PURE_IMPORTS_END */
  //# sourceMappingURL=first.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var IgnoreElementsSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(IgnoreElementsSubscriber, _super);
      function IgnoreElementsSubscriber() {
          return _super !== null && _super.apply(this, arguments) || this;
      }
      IgnoreElementsSubscriber.prototype._next = function (unused) {
      };
      return IgnoreElementsSubscriber;
  }(Subscriber));
  //# sourceMappingURL=ignoreElements.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var IsEmptySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(IsEmptySubscriber, _super);
      function IsEmptySubscriber(destination) {
          return _super.call(this, destination) || this;
      }
      IsEmptySubscriber.prototype.notifyComplete = function (isEmpty) {
          var destination = this.destination;
          destination.next(isEmpty);
          destination.complete();
      };
      IsEmptySubscriber.prototype._next = function (value) {
          this.notifyComplete(false);
      };
      IsEmptySubscriber.prototype._complete = function () {
          this.notifyComplete(true);
      };
      return IsEmptySubscriber;
  }(Subscriber));
  //# sourceMappingURL=isEmpty.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError,_observable_empty PURE_IMPORTS_END */
  var TakeLastSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(TakeLastSubscriber, _super);
      function TakeLastSubscriber(destination, total) {
          var _this = _super.call(this, destination) || this;
          _this.total = total;
          _this.ring = new Array();
          _this.count = 0;
          return _this;
      }
      TakeLastSubscriber.prototype._next = function (value) {
          var ring = this.ring;
          var total = this.total;
          var count = this.count++;
          if (ring.length < total) {
              ring.push(value);
          }
          else {
              var index = count % total;
              ring[index] = value;
          }
      };
      TakeLastSubscriber.prototype._complete = function () {
          var destination = this.destination;
          var count = this.count;
          if (count > 0) {
              var total = this.count >= this.total ? this.total : this.count;
              var ring = this.ring;
              for (var i = 0; i < total; i++) {
                  var idx = (count++) % total;
                  destination.next(ring[idx]);
              }
          }
          destination.complete();
      };
      return TakeLastSubscriber;
  }(Subscriber));
  //# sourceMappingURL=takeLast.js.map

  /** PURE_IMPORTS_START _util_EmptyError,_filter,_takeLast,_throwIfEmpty,_defaultIfEmpty,_util_identity PURE_IMPORTS_END */
  //# sourceMappingURL=last.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var MapToSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(MapToSubscriber, _super);
      function MapToSubscriber(destination, value) {
          var _this = _super.call(this, destination) || this;
          _this.value = value;
          return _this;
      }
      MapToSubscriber.prototype._next = function (x) {
          this.destination.next(this.value);
      };
      return MapToSubscriber;
  }(Subscriber));
  //# sourceMappingURL=mapTo.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_Notification PURE_IMPORTS_END */
  var MaterializeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(MaterializeSubscriber, _super);
      function MaterializeSubscriber(destination) {
          return _super.call(this, destination) || this;
      }
      MaterializeSubscriber.prototype._next = function (value) {
          this.destination.next(Notification.createNext(value));
      };
      MaterializeSubscriber.prototype._error = function (err) {
          var destination = this.destination;
          destination.next(Notification.createError(err));
          destination.complete();
      };
      MaterializeSubscriber.prototype._complete = function () {
          var destination = this.destination;
          destination.next(Notification.createComplete());
          destination.complete();
      };
      return MaterializeSubscriber;
  }(Subscriber));
  //# sourceMappingURL=materialize.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var ScanSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ScanSubscriber, _super);
      function ScanSubscriber(destination, accumulator, _seed, hasSeed) {
          var _this = _super.call(this, destination) || this;
          _this.accumulator = accumulator;
          _this._seed = _seed;
          _this.hasSeed = hasSeed;
          _this.index = 0;
          return _this;
      }
      Object.defineProperty(ScanSubscriber.prototype, "seed", {
          get: function () {
              return this._seed;
          },
          set: function (value) {
              this.hasSeed = true;
              this._seed = value;
          },
          enumerable: true,
          configurable: true
      });
      ScanSubscriber.prototype._next = function (value) {
          if (!this.hasSeed) {
              this.seed = value;
              this.destination.next(value);
          }
          else {
              return this._tryNext(value);
          }
      };
      ScanSubscriber.prototype._tryNext = function (value) {
          var index = this.index++;
          var result;
          try {
              result = this.accumulator(this.seed, value, index);
          }
          catch (err) {
              this.destination.error(err);
          }
          this.seed = result;
          this.destination.next(result);
      };
      return ScanSubscriber;
  }(Subscriber));
  //# sourceMappingURL=scan.js.map

  /** PURE_IMPORTS_START _scan,_takeLast,_defaultIfEmpty,_util_pipe PURE_IMPORTS_END */
  //# sourceMappingURL=reduce.js.map

  /** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */
  //# sourceMappingURL=max.js.map

  /** PURE_IMPORTS_START _observable_merge PURE_IMPORTS_END */
  //# sourceMappingURL=merge.js.map

  /** PURE_IMPORTS_START _mergeMap PURE_IMPORTS_END */
  //# sourceMappingURL=mergeMapTo.js.map

  /** PURE_IMPORTS_START tslib,_util_tryCatch,_util_errorObject,_util_subscribeToResult,_OuterSubscriber,_InnerSubscriber PURE_IMPORTS_END */
  var MergeScanSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(MergeScanSubscriber, _super);
      function MergeScanSubscriber(destination, accumulator, acc, concurrent) {
          var _this = _super.call(this, destination) || this;
          _this.accumulator = accumulator;
          _this.acc = acc;
          _this.concurrent = concurrent;
          _this.hasValue = false;
          _this.hasCompleted = false;
          _this.buffer = [];
          _this.active = 0;
          _this.index = 0;
          return _this;
      }
      MergeScanSubscriber.prototype._next = function (value) {
          if (this.active < this.concurrent) {
              var index = this.index++;
              var ish = tryCatch(this.accumulator)(this.acc, value);
              var destination = this.destination;
              if (ish === errorObject) {
                  destination.error(errorObject.e);
              }
              else {
                  this.active++;
                  this._innerSub(ish, value, index);
              }
          }
          else {
              this.buffer.push(value);
          }
      };
      MergeScanSubscriber.prototype._innerSub = function (ish, value, index) {
          var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
          var destination = this.destination;
          destination.add(innerSubscriber);
          subscribeToResult(this, ish, value, index, innerSubscriber);
      };
      MergeScanSubscriber.prototype._complete = function () {
          this.hasCompleted = true;
          if (this.active === 0 && this.buffer.length === 0) {
              if (this.hasValue === false) {
                  this.destination.next(this.acc);
              }
              this.destination.complete();
          }
          this.unsubscribe();
      };
      MergeScanSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          var destination = this.destination;
          this.acc = innerValue;
          this.hasValue = true;
          destination.next(innerValue);
      };
      MergeScanSubscriber.prototype.notifyComplete = function (innerSub) {
          var buffer = this.buffer;
          var destination = this.destination;
          destination.remove(innerSub);
          this.active--;
          if (buffer.length > 0) {
              this._next(buffer.shift());
          }
          else if (this.active === 0 && this.hasCompleted) {
              if (this.hasValue === false) {
                  this.destination.next(this.acc);
              }
              this.destination.complete();
          }
      };
      return MergeScanSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=mergeScan.js.map

  /** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */
  //# sourceMappingURL=min.js.map

  /** PURE_IMPORTS_START _observable_ConnectableObservable PURE_IMPORTS_END */
  //# sourceMappingURL=multicast.js.map

  /** PURE_IMPORTS_START tslib,_observable_from,_util_isArray,_OuterSubscriber,_InnerSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var OnErrorResumeNextSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(OnErrorResumeNextSubscriber, _super);
      function OnErrorResumeNextSubscriber(destination, nextSources) {
          var _this = _super.call(this, destination) || this;
          _this.destination = destination;
          _this.nextSources = nextSources;
          return _this;
      }
      OnErrorResumeNextSubscriber.prototype.notifyError = function (error, innerSub) {
          this.subscribeToNextSource();
      };
      OnErrorResumeNextSubscriber.prototype.notifyComplete = function (innerSub) {
          this.subscribeToNextSource();
      };
      OnErrorResumeNextSubscriber.prototype._error = function (err) {
          this.subscribeToNextSource();
          this.unsubscribe();
      };
      OnErrorResumeNextSubscriber.prototype._complete = function () {
          this.subscribeToNextSource();
          this.unsubscribe();
      };
      OnErrorResumeNextSubscriber.prototype.subscribeToNextSource = function () {
          var next = this.nextSources.shift();
          if (next) {
              var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
              var destination = this.destination;
              destination.add(innerSubscriber);
              subscribeToResult(this, next, undefined, undefined, innerSubscriber);
          }
          else {
              this.destination.complete();
          }
      };
      return OnErrorResumeNextSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=onErrorResumeNext.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var PairwiseSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(PairwiseSubscriber, _super);
      function PairwiseSubscriber(destination) {
          var _this = _super.call(this, destination) || this;
          _this.hasPrev = false;
          return _this;
      }
      PairwiseSubscriber.prototype._next = function (value) {
          if (this.hasPrev) {
              this.destination.next([this.prev, value]);
          }
          else {
              this.hasPrev = true;
          }
          this.prev = value;
      };
      return PairwiseSubscriber;
  }(Subscriber));
  //# sourceMappingURL=pairwise.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  //# sourceMappingURL=not.js.map

  /** PURE_IMPORTS_START _util_not,_filter PURE_IMPORTS_END */
  //# sourceMappingURL=partition.js.map

  /** PURE_IMPORTS_START _map PURE_IMPORTS_END */
  //# sourceMappingURL=pluck.js.map

  /** PURE_IMPORTS_START _Subject,_multicast PURE_IMPORTS_END */
  //# sourceMappingURL=publish.js.map

  /** PURE_IMPORTS_START _BehaviorSubject,_multicast PURE_IMPORTS_END */
  //# sourceMappingURL=publishBehavior.js.map

  /** PURE_IMPORTS_START _AsyncSubject,_multicast PURE_IMPORTS_END */
  //# sourceMappingURL=publishLast.js.map

  /** PURE_IMPORTS_START _ReplaySubject,_multicast PURE_IMPORTS_END */
  //# sourceMappingURL=publishReplay.js.map

  /** PURE_IMPORTS_START _util_isArray,_observable_race PURE_IMPORTS_END */
  //# sourceMappingURL=race.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_observable_empty PURE_IMPORTS_END */
  var RepeatSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(RepeatSubscriber, _super);
      function RepeatSubscriber(destination, count, source) {
          var _this = _super.call(this, destination) || this;
          _this.count = count;
          _this.source = source;
          return _this;
      }
      RepeatSubscriber.prototype.complete = function () {
          if (!this.isStopped) {
              var _a = this, source = _a.source, count = _a.count;
              if (count === 0) {
                  return _super.prototype.complete.call(this);
              }
              else if (count > -1) {
                  this.count = count - 1;
              }
              source.subscribe(this._unsubscribeAndRecycle());
          }
      };
      return RepeatSubscriber;
  }(Subscriber));
  //# sourceMappingURL=repeat.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var RepeatWhenSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(RepeatWhenSubscriber, _super);
      function RepeatWhenSubscriber(destination, notifier, source) {
          var _this = _super.call(this, destination) || this;
          _this.notifier = notifier;
          _this.source = source;
          _this.sourceIsBeingSubscribedTo = true;
          return _this;
      }
      RepeatWhenSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.sourceIsBeingSubscribedTo = true;
          this.source.subscribe(this);
      };
      RepeatWhenSubscriber.prototype.notifyComplete = function (innerSub) {
          if (this.sourceIsBeingSubscribedTo === false) {
              return _super.prototype.complete.call(this);
          }
      };
      RepeatWhenSubscriber.prototype.complete = function () {
          this.sourceIsBeingSubscribedTo = false;
          if (!this.isStopped) {
              if (!this.retries) {
                  this.subscribeToRetries();
              }
              if (!this.retriesSubscription || this.retriesSubscription.closed) {
                  return _super.prototype.complete.call(this);
              }
              this._unsubscribeAndRecycle();
              this.notifications.next();
          }
      };
      RepeatWhenSubscriber.prototype._unsubscribe = function () {
          var _a = this, notifications = _a.notifications, retriesSubscription = _a.retriesSubscription;
          if (notifications) {
              notifications.unsubscribe();
              this.notifications = null;
          }
          if (retriesSubscription) {
              retriesSubscription.unsubscribe();
              this.retriesSubscription = null;
          }
          this.retries = null;
      };
      RepeatWhenSubscriber.prototype._unsubscribeAndRecycle = function () {
          var _unsubscribe = this._unsubscribe;
          this._unsubscribe = null;
          _super.prototype._unsubscribeAndRecycle.call(this);
          this._unsubscribe = _unsubscribe;
          return this;
      };
      RepeatWhenSubscriber.prototype.subscribeToRetries = function () {
          this.notifications = new Subject();
          var retries = tryCatch(this.notifier)(this.notifications);
          if (retries === errorObject) {
              return _super.prototype.complete.call(this);
          }
          this.retries = retries;
          this.retriesSubscription = subscribeToResult(this, retries);
      };
      return RepeatWhenSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=repeatWhen.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var RetrySubscriber = /*@__PURE__*/ (function (_super) {
      __extends(RetrySubscriber, _super);
      function RetrySubscriber(destination, count, source) {
          var _this = _super.call(this, destination) || this;
          _this.count = count;
          _this.source = source;
          return _this;
      }
      RetrySubscriber.prototype.error = function (err) {
          if (!this.isStopped) {
              var _a = this, source = _a.source, count = _a.count;
              if (count === 0) {
                  return _super.prototype.error.call(this, err);
              }
              else if (count > -1) {
                  this.count = count - 1;
              }
              source.subscribe(this._unsubscribeAndRecycle());
          }
      };
      return RetrySubscriber;
  }(Subscriber));
  //# sourceMappingURL=retry.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var RetryWhenSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(RetryWhenSubscriber, _super);
      function RetryWhenSubscriber(destination, notifier, source) {
          var _this = _super.call(this, destination) || this;
          _this.notifier = notifier;
          _this.source = source;
          return _this;
      }
      RetryWhenSubscriber.prototype.error = function (err) {
          if (!this.isStopped) {
              var errors = this.errors;
              var retries = this.retries;
              var retriesSubscription = this.retriesSubscription;
              if (!retries) {
                  errors = new Subject();
                  retries = tryCatch(this.notifier)(errors);
                  if (retries === errorObject) {
                      return _super.prototype.error.call(this, errorObject.e);
                  }
                  retriesSubscription = subscribeToResult(this, retries);
              }
              else {
                  this.errors = null;
                  this.retriesSubscription = null;
              }
              this._unsubscribeAndRecycle();
              this.errors = errors;
              this.retries = retries;
              this.retriesSubscription = retriesSubscription;
              errors.next(err);
          }
      };
      RetryWhenSubscriber.prototype._unsubscribe = function () {
          var _a = this, errors = _a.errors, retriesSubscription = _a.retriesSubscription;
          if (errors) {
              errors.unsubscribe();
              this.errors = null;
          }
          if (retriesSubscription) {
              retriesSubscription.unsubscribe();
              this.retriesSubscription = null;
          }
          this.retries = null;
      };
      RetryWhenSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          var _unsubscribe = this._unsubscribe;
          this._unsubscribe = null;
          this._unsubscribeAndRecycle();
          this._unsubscribe = _unsubscribe;
          this.source.subscribe(this);
      };
      return RetryWhenSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=retryWhen.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var SampleSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SampleSubscriber, _super);
      function SampleSubscriber() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.hasValue = false;
          return _this;
      }
      SampleSubscriber.prototype._next = function (value) {
          this.value = value;
          this.hasValue = true;
      };
      SampleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.emitValue();
      };
      SampleSubscriber.prototype.notifyComplete = function () {
          this.emitValue();
      };
      SampleSubscriber.prototype.emitValue = function () {
          if (this.hasValue) {
              this.hasValue = false;
              this.destination.next(this.value);
          }
      };
      return SampleSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=sample.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async PURE_IMPORTS_END */
  var SampleTimeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SampleTimeSubscriber, _super);
      function SampleTimeSubscriber(destination, period, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.period = period;
          _this.scheduler = scheduler;
          _this.hasValue = false;
          _this.add(scheduler.schedule(dispatchNotification, period, { subscriber: _this, period: period }));
          return _this;
      }
      SampleTimeSubscriber.prototype._next = function (value) {
          this.lastValue = value;
          this.hasValue = true;
      };
      SampleTimeSubscriber.prototype.notifyNext = function () {
          if (this.hasValue) {
              this.hasValue = false;
              this.destination.next(this.lastValue);
          }
      };
      return SampleTimeSubscriber;
  }(Subscriber));
  function dispatchNotification(state) {
      var subscriber = state.subscriber, period = state.period;
      subscriber.notifyNext();
      this.schedule(state, period);
  }
  //# sourceMappingURL=sampleTime.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_tryCatch,_util_errorObject PURE_IMPORTS_END */
  var SequenceEqualSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SequenceEqualSubscriber, _super);
      function SequenceEqualSubscriber(destination, compareTo, comparor) {
          var _this = _super.call(this, destination) || this;
          _this.compareTo = compareTo;
          _this.comparor = comparor;
          _this._a = [];
          _this._b = [];
          _this._oneComplete = false;
          _this.destination.add(compareTo.subscribe(new SequenceEqualCompareToSubscriber(destination, _this)));
          return _this;
      }
      SequenceEqualSubscriber.prototype._next = function (value) {
          if (this._oneComplete && this._b.length === 0) {
              this.emit(false);
          }
          else {
              this._a.push(value);
              this.checkValues();
          }
      };
      SequenceEqualSubscriber.prototype._complete = function () {
          if (this._oneComplete) {
              this.emit(this._a.length === 0 && this._b.length === 0);
          }
          else {
              this._oneComplete = true;
          }
          this.unsubscribe();
      };
      SequenceEqualSubscriber.prototype.checkValues = function () {
          var _c = this, _a = _c._a, _b = _c._b, comparor = _c.comparor;
          while (_a.length > 0 && _b.length > 0) {
              var a = _a.shift();
              var b = _b.shift();
              var areEqual = false;
              if (comparor) {
                  areEqual = tryCatch(comparor)(a, b);
                  if (areEqual === errorObject) {
                      this.destination.error(errorObject.e);
                  }
              }
              else {
                  areEqual = a === b;
              }
              if (!areEqual) {
                  this.emit(false);
              }
          }
      };
      SequenceEqualSubscriber.prototype.emit = function (value) {
          var destination = this.destination;
          destination.next(value);
          destination.complete();
      };
      SequenceEqualSubscriber.prototype.nextB = function (value) {
          if (this._oneComplete && this._a.length === 0) {
              this.emit(false);
          }
          else {
              this._b.push(value);
              this.checkValues();
          }
      };
      SequenceEqualSubscriber.prototype.completeB = function () {
          if (this._oneComplete) {
              this.emit(this._a.length === 0 && this._b.length === 0);
          }
          else {
              this._oneComplete = true;
          }
      };
      return SequenceEqualSubscriber;
  }(Subscriber));
  var SequenceEqualCompareToSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SequenceEqualCompareToSubscriber, _super);
      function SequenceEqualCompareToSubscriber(destination, parent) {
          var _this = _super.call(this, destination) || this;
          _this.parent = parent;
          return _this;
      }
      SequenceEqualCompareToSubscriber.prototype._next = function (value) {
          this.parent.nextB(value);
      };
      SequenceEqualCompareToSubscriber.prototype._error = function (err) {
          this.parent.error(err);
          this.unsubscribe();
      };
      SequenceEqualCompareToSubscriber.prototype._complete = function () {
          this.parent.completeB();
          this.unsubscribe();
      };
      return SequenceEqualCompareToSubscriber;
  }(Subscriber));
  //# sourceMappingURL=sequenceEqual.js.map

  /** PURE_IMPORTS_START _multicast,_refCount,_Subject PURE_IMPORTS_END */
  //# sourceMappingURL=share.js.map

  /** PURE_IMPORTS_START _ReplaySubject PURE_IMPORTS_END */
  //# sourceMappingURL=shareReplay.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_EmptyError PURE_IMPORTS_END */
  var SingleSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SingleSubscriber, _super);
      function SingleSubscriber(destination, predicate, source) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.source = source;
          _this.seenValue = false;
          _this.index = 0;
          return _this;
      }
      SingleSubscriber.prototype.applySingleValue = function (value) {
          if (this.seenValue) {
              this.destination.error('Sequence contains more than one element');
          }
          else {
              this.seenValue = true;
              this.singleValue = value;
          }
      };
      SingleSubscriber.prototype._next = function (value) {
          var index = this.index++;
          if (this.predicate) {
              this.tryNext(value, index);
          }
          else {
              this.applySingleValue(value);
          }
      };
      SingleSubscriber.prototype.tryNext = function (value, index) {
          try {
              if (this.predicate(value, index, this.source)) {
                  this.applySingleValue(value);
              }
          }
          catch (err) {
              this.destination.error(err);
          }
      };
      SingleSubscriber.prototype._complete = function () {
          var destination = this.destination;
          if (this.index > 0) {
              destination.next(this.seenValue ? this.singleValue : undefined);
              destination.complete();
          }
          else {
              destination.error(new EmptyError);
          }
      };
      return SingleSubscriber;
  }(Subscriber));
  //# sourceMappingURL=single.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var SkipSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SkipSubscriber, _super);
      function SkipSubscriber(destination, total) {
          var _this = _super.call(this, destination) || this;
          _this.total = total;
          _this.count = 0;
          return _this;
      }
      SkipSubscriber.prototype._next = function (x) {
          if (++this.count > this.total) {
              this.destination.next(x);
          }
      };
      return SkipSubscriber;
  }(Subscriber));
  //# sourceMappingURL=skip.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_util_ArgumentOutOfRangeError PURE_IMPORTS_END */
  var SkipLastSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SkipLastSubscriber, _super);
      function SkipLastSubscriber(destination, _skipCount) {
          var _this = _super.call(this, destination) || this;
          _this._skipCount = _skipCount;
          _this._count = 0;
          _this._ring = new Array(_skipCount);
          return _this;
      }
      SkipLastSubscriber.prototype._next = function (value) {
          var skipCount = this._skipCount;
          var count = this._count++;
          if (count < skipCount) {
              this._ring[count] = value;
          }
          else {
              var currentIndex = count % skipCount;
              var ring = this._ring;
              var oldValue = ring[currentIndex];
              ring[currentIndex] = value;
              this.destination.next(oldValue);
          }
      };
      return SkipLastSubscriber;
  }(Subscriber));
  //# sourceMappingURL=skipLast.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_InnerSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var SkipUntilSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SkipUntilSubscriber, _super);
      function SkipUntilSubscriber(destination, notifier) {
          var _this = _super.call(this, destination) || this;
          _this.hasValue = false;
          var innerSubscriber = new InnerSubscriber(_this, undefined, undefined);
          _this.add(innerSubscriber);
          _this.innerSubscription = innerSubscriber;
          subscribeToResult(_this, notifier, undefined, undefined, innerSubscriber);
          return _this;
      }
      SkipUntilSubscriber.prototype._next = function (value) {
          if (this.hasValue) {
              _super.prototype._next.call(this, value);
          }
      };
      SkipUntilSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.hasValue = true;
          if (this.innerSubscription) {
              this.innerSubscription.unsubscribe();
          }
      };
      SkipUntilSubscriber.prototype.notifyComplete = function () {
      };
      return SkipUntilSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=skipUntil.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var SkipWhileSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SkipWhileSubscriber, _super);
      function SkipWhileSubscriber(destination, predicate) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.skipping = true;
          _this.index = 0;
          return _this;
      }
      SkipWhileSubscriber.prototype._next = function (value) {
          var destination = this.destination;
          if (this.skipping) {
              this.tryCallPredicate(value);
          }
          if (!this.skipping) {
              destination.next(value);
          }
      };
      SkipWhileSubscriber.prototype.tryCallPredicate = function (value) {
          try {
              var result = this.predicate(value, this.index++);
              this.skipping = Boolean(result);
          }
          catch (err) {
              this.destination.error(err);
          }
      };
      return SkipWhileSubscriber;
  }(Subscriber));
  //# sourceMappingURL=skipWhile.js.map

  /** PURE_IMPORTS_START _observable_fromArray,_observable_scalar,_observable_empty,_observable_concat,_util_isScheduler PURE_IMPORTS_END */
  //# sourceMappingURL=startWith.js.map

  /** PURE_IMPORTS_START tslib,_Observable,_scheduler_asap,_util_isNumeric PURE_IMPORTS_END */
  var SubscribeOnObservable = /*@__PURE__*/ (function (_super) {
      __extends(SubscribeOnObservable, _super);
      function SubscribeOnObservable(source, delayTime, scheduler) {
          if (delayTime === void 0) {
              delayTime = 0;
          }
          if (scheduler === void 0) {
              scheduler = asap;
          }
          var _this = _super.call(this) || this;
          _this.source = source;
          _this.delayTime = delayTime;
          _this.scheduler = scheduler;
          if (!isNumeric(delayTime) || delayTime < 0) {
              _this.delayTime = 0;
          }
          if (!scheduler || typeof scheduler.schedule !== 'function') {
              _this.scheduler = asap;
          }
          return _this;
      }
      SubscribeOnObservable.create = function (source, delay, scheduler) {
          if (delay === void 0) {
              delay = 0;
          }
          if (scheduler === void 0) {
              scheduler = asap;
          }
          return new SubscribeOnObservable(source, delay, scheduler);
      };
      SubscribeOnObservable.dispatch = function (arg) {
          var source = arg.source, subscriber = arg.subscriber;
          return this.add(source.subscribe(subscriber));
      };
      SubscribeOnObservable.prototype._subscribe = function (subscriber) {
          var delay = this.delayTime;
          var source = this.source;
          var scheduler = this.scheduler;
          return scheduler.schedule(SubscribeOnObservable.dispatch, delay, {
              source: source, subscriber: subscriber
          });
      };
      return SubscribeOnObservable;
  }(Observable));
  //# sourceMappingURL=SubscribeOnObservable.js.map

  /** PURE_IMPORTS_START _observable_SubscribeOnObservable PURE_IMPORTS_END */
  //# sourceMappingURL=subscribeOn.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_InnerSubscriber,_util_subscribeToResult,_map,_observable_from PURE_IMPORTS_END */
  function switchMap(project, resultSelector) {
      if (typeof resultSelector === 'function') {
          return function (source) { return source.pipe(switchMap(function (a, i) { return from(project(a, i)).pipe(map(function (b, ii) { return resultSelector(a, b, i, ii); })); })); };
      }
      return function (source) { return source.lift(new SwitchMapOperator(project)); };
  }
  var SwitchMapOperator = /*@__PURE__*/ (function () {
      function SwitchMapOperator(project) {
          this.project = project;
      }
      SwitchMapOperator.prototype.call = function (subscriber, source) {
          return source.subscribe(new SwitchMapSubscriber(subscriber, this.project));
      };
      return SwitchMapOperator;
  }());
  var SwitchMapSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(SwitchMapSubscriber, _super);
      function SwitchMapSubscriber(destination, project) {
          var _this = _super.call(this, destination) || this;
          _this.project = project;
          _this.index = 0;
          return _this;
      }
      SwitchMapSubscriber.prototype._next = function (value) {
          var result;
          var index = this.index++;
          try {
              result = this.project(value, index);
          }
          catch (error) {
              this.destination.error(error);
              return;
          }
          this._innerSub(result, value, index);
      };
      SwitchMapSubscriber.prototype._innerSub = function (result, value, index) {
          var innerSubscription = this.innerSubscription;
          if (innerSubscription) {
              innerSubscription.unsubscribe();
          }
          var innerSubscriber = new InnerSubscriber(this, undefined, undefined);
          var destination = this.destination;
          destination.add(innerSubscriber);
          this.innerSubscription = subscribeToResult(this, result, value, index, innerSubscriber);
      };
      SwitchMapSubscriber.prototype._complete = function () {
          var innerSubscription = this.innerSubscription;
          if (!innerSubscription || innerSubscription.closed) {
              _super.prototype._complete.call(this);
          }
          this.unsubscribe();
      };
      SwitchMapSubscriber.prototype._unsubscribe = function () {
          this.innerSubscription = null;
      };
      SwitchMapSubscriber.prototype.notifyComplete = function (innerSub) {
          var destination = this.destination;
          destination.remove(innerSub);
          this.innerSubscription = null;
          if (this.isStopped) {
              _super.prototype._complete.call(this);
          }
      };
      SwitchMapSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.destination.next(innerValue);
      };
      return SwitchMapSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=switchMap.js.map

  /** PURE_IMPORTS_START _switchMap,_util_identity PURE_IMPORTS_END */
  //# sourceMappingURL=switchAll.js.map

  /** PURE_IMPORTS_START _switchMap PURE_IMPORTS_END */
  //# sourceMappingURL=switchMapTo.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var TakeUntilSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(TakeUntilSubscriber, _super);
      function TakeUntilSubscriber(destination) {
          var _this = _super.call(this, destination) || this;
          _this.seenValue = false;
          return _this;
      }
      TakeUntilSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.seenValue = true;
          this.complete();
      };
      TakeUntilSubscriber.prototype.notifyComplete = function () {
      };
      return TakeUntilSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=takeUntil.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber PURE_IMPORTS_END */
  var TakeWhileSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(TakeWhileSubscriber, _super);
      function TakeWhileSubscriber(destination, predicate) {
          var _this = _super.call(this, destination) || this;
          _this.predicate = predicate;
          _this.index = 0;
          return _this;
      }
      TakeWhileSubscriber.prototype._next = function (value) {
          var destination = this.destination;
          var result;
          try {
              result = this.predicate(value, this.index++);
          }
          catch (err) {
              destination.error(err);
              return;
          }
          this.nextOrComplete(value, result);
      };
      TakeWhileSubscriber.prototype.nextOrComplete = function (value, predicateResult) {
          var destination = this.destination;
          if (Boolean(predicateResult)) {
              destination.next(value);
          }
          else {
              destination.complete();
          }
      };
      return TakeWhileSubscriber;
  }(Subscriber));
  //# sourceMappingURL=takeWhile.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var ThrottleSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ThrottleSubscriber, _super);
      function ThrottleSubscriber(destination, durationSelector, _leading, _trailing) {
          var _this = _super.call(this, destination) || this;
          _this.destination = destination;
          _this.durationSelector = durationSelector;
          _this._leading = _leading;
          _this._trailing = _trailing;
          _this._hasValue = false;
          return _this;
      }
      ThrottleSubscriber.prototype._next = function (value) {
          this._hasValue = true;
          this._sendValue = value;
          if (!this._throttled) {
              if (this._leading) {
                  this.send();
              }
              else {
                  this.throttle(value);
              }
          }
      };
      ThrottleSubscriber.prototype.send = function () {
          var _a = this, _hasValue = _a._hasValue, _sendValue = _a._sendValue;
          if (_hasValue) {
              this.destination.next(_sendValue);
              this.throttle(_sendValue);
          }
          this._hasValue = false;
          this._sendValue = null;
      };
      ThrottleSubscriber.prototype.throttle = function (value) {
          var duration = this.tryDurationSelector(value);
          if (duration) {
              this.add(this._throttled = subscribeToResult(this, duration));
          }
      };
      ThrottleSubscriber.prototype.tryDurationSelector = function (value) {
          try {
              return this.durationSelector(value);
          }
          catch (err) {
              this.destination.error(err);
              return null;
          }
      };
      ThrottleSubscriber.prototype.throttlingDone = function () {
          var _a = this, _throttled = _a._throttled, _trailing = _a._trailing;
          if (_throttled) {
              _throttled.unsubscribe();
          }
          this._throttled = null;
          if (_trailing) {
              this.send();
          }
      };
      ThrottleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.throttlingDone();
      };
      ThrottleSubscriber.prototype.notifyComplete = function () {
          this.throttlingDone();
      };
      return ThrottleSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=throttle.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_scheduler_async,_throttle PURE_IMPORTS_END */
  var ThrottleTimeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(ThrottleTimeSubscriber, _super);
      function ThrottleTimeSubscriber(destination, duration, scheduler, leading, trailing) {
          var _this = _super.call(this, destination) || this;
          _this.duration = duration;
          _this.scheduler = scheduler;
          _this.leading = leading;
          _this.trailing = trailing;
          _this._hasTrailingValue = false;
          _this._trailingValue = null;
          return _this;
      }
      ThrottleTimeSubscriber.prototype._next = function (value) {
          if (this.throttled) {
              if (this.trailing) {
                  this._trailingValue = value;
                  this._hasTrailingValue = true;
              }
          }
          else {
              this.add(this.throttled = this.scheduler.schedule(dispatchNext$3, this.duration, { subscriber: this }));
              if (this.leading) {
                  this.destination.next(value);
              }
          }
      };
      ThrottleTimeSubscriber.prototype._complete = function () {
          if (this._hasTrailingValue) {
              this.destination.next(this._trailingValue);
              this.destination.complete();
          }
          else {
              this.destination.complete();
          }
      };
      ThrottleTimeSubscriber.prototype.clearThrottle = function () {
          var throttled = this.throttled;
          if (throttled) {
              if (this.trailing && this._hasTrailingValue) {
                  this.destination.next(this._trailingValue);
                  this._trailingValue = null;
                  this._hasTrailingValue = false;
              }
              throttled.unsubscribe();
              this.remove(throttled);
              this.throttled = null;
          }
      };
      return ThrottleTimeSubscriber;
  }(Subscriber));
  function dispatchNext$3(arg) {
      var subscriber = arg.subscriber;
      subscriber.clearThrottle();
  }
  //# sourceMappingURL=throttleTime.js.map

  /** PURE_IMPORTS_START _scheduler_async,_scan,_observable_defer,_map PURE_IMPORTS_END */
  //# sourceMappingURL=timeInterval.js.map

  /** PURE_IMPORTS_START tslib,_scheduler_async,_util_isDate,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var TimeoutWithSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(TimeoutWithSubscriber, _super);
      function TimeoutWithSubscriber(destination, absoluteTimeout, waitFor, withObservable, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.absoluteTimeout = absoluteTimeout;
          _this.waitFor = waitFor;
          _this.withObservable = withObservable;
          _this.scheduler = scheduler;
          _this.action = null;
          _this.scheduleTimeout();
          return _this;
      }
      TimeoutWithSubscriber.dispatchTimeout = function (subscriber) {
          var withObservable = subscriber.withObservable;
          subscriber._unsubscribeAndRecycle();
          subscriber.add(subscribeToResult(subscriber, withObservable));
      };
      TimeoutWithSubscriber.prototype.scheduleTimeout = function () {
          var action = this.action;
          if (action) {
              this.action = action.schedule(this, this.waitFor);
          }
          else {
              this.add(this.action = this.scheduler.schedule(TimeoutWithSubscriber.dispatchTimeout, this.waitFor, this));
          }
      };
      TimeoutWithSubscriber.prototype._next = function (value) {
          if (!this.absoluteTimeout) {
              this.scheduleTimeout();
          }
          _super.prototype._next.call(this, value);
      };
      TimeoutWithSubscriber.prototype._unsubscribe = function () {
          this.action = null;
          this.scheduler = null;
          this.withObservable = null;
      };
      return TimeoutWithSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=timeoutWith.js.map

  /** PURE_IMPORTS_START _scheduler_async,_util_TimeoutError,_timeoutWith,_observable_throwError PURE_IMPORTS_END */
  //# sourceMappingURL=timeout.js.map

  /** PURE_IMPORTS_START _scheduler_async,_map PURE_IMPORTS_END */
  //# sourceMappingURL=timestamp.js.map

  /** PURE_IMPORTS_START _reduce PURE_IMPORTS_END */
  //# sourceMappingURL=toArray.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var WindowSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(WindowSubscriber, _super);
      function WindowSubscriber(destination) {
          var _this = _super.call(this, destination) || this;
          _this.window = new Subject();
          destination.next(_this.window);
          return _this;
      }
      WindowSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.openWindow();
      };
      WindowSubscriber.prototype.notifyError = function (error, innerSub) {
          this._error(error);
      };
      WindowSubscriber.prototype.notifyComplete = function (innerSub) {
          this._complete();
      };
      WindowSubscriber.prototype._next = function (value) {
          this.window.next(value);
      };
      WindowSubscriber.prototype._error = function (err) {
          this.window.error(err);
          this.destination.error(err);
      };
      WindowSubscriber.prototype._complete = function () {
          this.window.complete();
          this.destination.complete();
      };
      WindowSubscriber.prototype._unsubscribe = function () {
          this.window = null;
      };
      WindowSubscriber.prototype.openWindow = function () {
          var prevWindow = this.window;
          if (prevWindow) {
              prevWindow.complete();
          }
          var destination = this.destination;
          var newWindow = this.window = new Subject();
          destination.next(newWindow);
      };
      return WindowSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=window.js.map

  /** PURE_IMPORTS_START tslib,_Subscriber,_Subject PURE_IMPORTS_END */
  var WindowCountSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(WindowCountSubscriber, _super);
      function WindowCountSubscriber(destination, windowSize, startWindowEvery) {
          var _this = _super.call(this, destination) || this;
          _this.destination = destination;
          _this.windowSize = windowSize;
          _this.startWindowEvery = startWindowEvery;
          _this.windows = [new Subject()];
          _this.count = 0;
          destination.next(_this.windows[0]);
          return _this;
      }
      WindowCountSubscriber.prototype._next = function (value) {
          var startWindowEvery = (this.startWindowEvery > 0) ? this.startWindowEvery : this.windowSize;
          var destination = this.destination;
          var windowSize = this.windowSize;
          var windows = this.windows;
          var len = windows.length;
          for (var i = 0; i < len && !this.closed; i++) {
              windows[i].next(value);
          }
          var c = this.count - windowSize + 1;
          if (c >= 0 && c % startWindowEvery === 0 && !this.closed) {
              windows.shift().complete();
          }
          if (++this.count % startWindowEvery === 0 && !this.closed) {
              var window_1 = new Subject();
              windows.push(window_1);
              destination.next(window_1);
          }
      };
      WindowCountSubscriber.prototype._error = function (err) {
          var windows = this.windows;
          if (windows) {
              while (windows.length > 0 && !this.closed) {
                  windows.shift().error(err);
              }
          }
          this.destination.error(err);
      };
      WindowCountSubscriber.prototype._complete = function () {
          var windows = this.windows;
          if (windows) {
              while (windows.length > 0 && !this.closed) {
                  windows.shift().complete();
              }
          }
          this.destination.complete();
      };
      WindowCountSubscriber.prototype._unsubscribe = function () {
          this.count = 0;
          this.windows = null;
      };
      return WindowCountSubscriber;
  }(Subscriber));
  //# sourceMappingURL=windowCount.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_scheduler_async,_Subscriber,_util_isNumeric,_util_isScheduler PURE_IMPORTS_END */
  var CountedSubject = /*@__PURE__*/ (function (_super) {
      __extends(CountedSubject, _super);
      function CountedSubject() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this._numberOfNextedValues = 0;
          return _this;
      }
      CountedSubject.prototype.next = function (value) {
          this._numberOfNextedValues++;
          _super.prototype.next.call(this, value);
      };
      Object.defineProperty(CountedSubject.prototype, "numberOfNextedValues", {
          get: function () {
              return this._numberOfNextedValues;
          },
          enumerable: true,
          configurable: true
      });
      return CountedSubject;
  }(Subject));
  var WindowTimeSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(WindowTimeSubscriber, _super);
      function WindowTimeSubscriber(destination, windowTimeSpan, windowCreationInterval, maxWindowSize, scheduler) {
          var _this = _super.call(this, destination) || this;
          _this.destination = destination;
          _this.windowTimeSpan = windowTimeSpan;
          _this.windowCreationInterval = windowCreationInterval;
          _this.maxWindowSize = maxWindowSize;
          _this.scheduler = scheduler;
          _this.windows = [];
          var window = _this.openWindow();
          if (windowCreationInterval !== null && windowCreationInterval >= 0) {
              var closeState = { subscriber: _this, window: window, context: null };
              var creationState = { windowTimeSpan: windowTimeSpan, windowCreationInterval: windowCreationInterval, subscriber: _this, scheduler: scheduler };
              _this.add(scheduler.schedule(dispatchWindowClose, windowTimeSpan, closeState));
              _this.add(scheduler.schedule(dispatchWindowCreation, windowCreationInterval, creationState));
          }
          else {
              var timeSpanOnlyState = { subscriber: _this, window: window, windowTimeSpan: windowTimeSpan };
              _this.add(scheduler.schedule(dispatchWindowTimeSpanOnly, windowTimeSpan, timeSpanOnlyState));
          }
          return _this;
      }
      WindowTimeSubscriber.prototype._next = function (value) {
          var windows = this.windows;
          var len = windows.length;
          for (var i = 0; i < len; i++) {
              var window_1 = windows[i];
              if (!window_1.closed) {
                  window_1.next(value);
                  if (window_1.numberOfNextedValues >= this.maxWindowSize) {
                      this.closeWindow(window_1);
                  }
              }
          }
      };
      WindowTimeSubscriber.prototype._error = function (err) {
          var windows = this.windows;
          while (windows.length > 0) {
              windows.shift().error(err);
          }
          this.destination.error(err);
      };
      WindowTimeSubscriber.prototype._complete = function () {
          var windows = this.windows;
          while (windows.length > 0) {
              var window_2 = windows.shift();
              if (!window_2.closed) {
                  window_2.complete();
              }
          }
          this.destination.complete();
      };
      WindowTimeSubscriber.prototype.openWindow = function () {
          var window = new CountedSubject();
          this.windows.push(window);
          var destination = this.destination;
          destination.next(window);
          return window;
      };
      WindowTimeSubscriber.prototype.closeWindow = function (window) {
          window.complete();
          var windows = this.windows;
          windows.splice(windows.indexOf(window), 1);
      };
      return WindowTimeSubscriber;
  }(Subscriber));
  function dispatchWindowTimeSpanOnly(state) {
      var subscriber = state.subscriber, windowTimeSpan = state.windowTimeSpan, window = state.window;
      if (window) {
          subscriber.closeWindow(window);
      }
      state.window = subscriber.openWindow();
      this.schedule(state, windowTimeSpan);
  }
  function dispatchWindowCreation(state) {
      var windowTimeSpan = state.windowTimeSpan, subscriber = state.subscriber, scheduler = state.scheduler, windowCreationInterval = state.windowCreationInterval;
      var window = subscriber.openWindow();
      var action = this;
      var context = { action: action, subscription: null };
      var timeSpanState = { subscriber: subscriber, window: window, context: context };
      context.subscription = scheduler.schedule(dispatchWindowClose, windowTimeSpan, timeSpanState);
      action.add(context.subscription);
      action.schedule(state, windowCreationInterval);
  }
  function dispatchWindowClose(state) {
      var subscriber = state.subscriber, window = state.window, context = state.context;
      if (context && context.action && context.subscription) {
          context.action.remove(context.subscription);
      }
      subscriber.closeWindow(window);
  }
  //# sourceMappingURL=windowTime.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_Subscription,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var WindowToggleSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(WindowToggleSubscriber, _super);
      function WindowToggleSubscriber(destination, openings, closingSelector) {
          var _this = _super.call(this, destination) || this;
          _this.openings = openings;
          _this.closingSelector = closingSelector;
          _this.contexts = [];
          _this.add(_this.openSubscription = subscribeToResult(_this, openings, openings));
          return _this;
      }
      WindowToggleSubscriber.prototype._next = function (value) {
          var contexts = this.contexts;
          if (contexts) {
              var len = contexts.length;
              for (var i = 0; i < len; i++) {
                  contexts[i].window.next(value);
              }
          }
      };
      WindowToggleSubscriber.prototype._error = function (err) {
          var contexts = this.contexts;
          this.contexts = null;
          if (contexts) {
              var len = contexts.length;
              var index = -1;
              while (++index < len) {
                  var context_1 = contexts[index];
                  context_1.window.error(err);
                  context_1.subscription.unsubscribe();
              }
          }
          _super.prototype._error.call(this, err);
      };
      WindowToggleSubscriber.prototype._complete = function () {
          var contexts = this.contexts;
          this.contexts = null;
          if (contexts) {
              var len = contexts.length;
              var index = -1;
              while (++index < len) {
                  var context_2 = contexts[index];
                  context_2.window.complete();
                  context_2.subscription.unsubscribe();
              }
          }
          _super.prototype._complete.call(this);
      };
      WindowToggleSubscriber.prototype._unsubscribe = function () {
          var contexts = this.contexts;
          this.contexts = null;
          if (contexts) {
              var len = contexts.length;
              var index = -1;
              while (++index < len) {
                  var context_3 = contexts[index];
                  context_3.window.unsubscribe();
                  context_3.subscription.unsubscribe();
              }
          }
      };
      WindowToggleSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          if (outerValue === this.openings) {
              var closingSelector = this.closingSelector;
              var closingNotifier = tryCatch(closingSelector)(innerValue);
              if (closingNotifier === errorObject) {
                  return this.error(errorObject.e);
              }
              else {
                  var window_1 = new Subject();
                  var subscription = new Subscription();
                  var context_4 = { window: window_1, subscription: subscription };
                  this.contexts.push(context_4);
                  var innerSubscription = subscribeToResult(this, closingNotifier, context_4);
                  if (innerSubscription.closed) {
                      this.closeWindow(this.contexts.length - 1);
                  }
                  else {
                      innerSubscription.context = context_4;
                      subscription.add(innerSubscription);
                  }
                  this.destination.next(window_1);
              }
          }
          else {
              this.closeWindow(this.contexts.indexOf(outerValue));
          }
      };
      WindowToggleSubscriber.prototype.notifyError = function (err) {
          this.error(err);
      };
      WindowToggleSubscriber.prototype.notifyComplete = function (inner) {
          if (inner !== this.openSubscription) {
              this.closeWindow(this.contexts.indexOf(inner.context));
          }
      };
      WindowToggleSubscriber.prototype.closeWindow = function (index) {
          if (index === -1) {
              return;
          }
          var contexts = this.contexts;
          var context = contexts[index];
          var window = context.window, subscription = context.subscription;
          contexts.splice(index, 1);
          window.complete();
          subscription.unsubscribe();
      };
      return WindowToggleSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=windowToggle.js.map

  /** PURE_IMPORTS_START tslib,_Subject,_util_tryCatch,_util_errorObject,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var WindowSubscriber$1 = /*@__PURE__*/ (function (_super) {
      __extends(WindowSubscriber, _super);
      function WindowSubscriber(destination, closingSelector) {
          var _this = _super.call(this, destination) || this;
          _this.destination = destination;
          _this.closingSelector = closingSelector;
          _this.openWindow();
          return _this;
      }
      WindowSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.openWindow(innerSub);
      };
      WindowSubscriber.prototype.notifyError = function (error, innerSub) {
          this._error(error);
      };
      WindowSubscriber.prototype.notifyComplete = function (innerSub) {
          this.openWindow(innerSub);
      };
      WindowSubscriber.prototype._next = function (value) {
          this.window.next(value);
      };
      WindowSubscriber.prototype._error = function (err) {
          this.window.error(err);
          this.destination.error(err);
          this.unsubscribeClosingNotification();
      };
      WindowSubscriber.prototype._complete = function () {
          this.window.complete();
          this.destination.complete();
          this.unsubscribeClosingNotification();
      };
      WindowSubscriber.prototype.unsubscribeClosingNotification = function () {
          if (this.closingNotification) {
              this.closingNotification.unsubscribe();
          }
      };
      WindowSubscriber.prototype.openWindow = function (innerSub) {
          if (innerSub === void 0) {
              innerSub = null;
          }
          if (innerSub) {
              this.remove(innerSub);
              innerSub.unsubscribe();
          }
          var prevWindow = this.window;
          if (prevWindow) {
              prevWindow.complete();
          }
          var window = this.window = new Subject();
          this.destination.next(window);
          var closingNotifier = tryCatch(this.closingSelector)();
          if (closingNotifier === errorObject) {
              var err = errorObject.e;
              this.destination.error(err);
              this.window.error(err);
          }
          else {
              this.add(this.closingNotification = subscribeToResult(this, closingNotifier));
          }
      };
      return WindowSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=windowWhen.js.map

  /** PURE_IMPORTS_START tslib,_OuterSubscriber,_util_subscribeToResult PURE_IMPORTS_END */
  var WithLatestFromSubscriber = /*@__PURE__*/ (function (_super) {
      __extends(WithLatestFromSubscriber, _super);
      function WithLatestFromSubscriber(destination, observables, project) {
          var _this = _super.call(this, destination) || this;
          _this.observables = observables;
          _this.project = project;
          _this.toRespond = [];
          var len = observables.length;
          _this.values = new Array(len);
          for (var i = 0; i < len; i++) {
              _this.toRespond.push(i);
          }
          for (var i = 0; i < len; i++) {
              var observable = observables[i];
              _this.add(subscribeToResult(_this, observable, observable, i));
          }
          return _this;
      }
      WithLatestFromSubscriber.prototype.notifyNext = function (outerValue, innerValue, outerIndex, innerIndex, innerSub) {
          this.values[outerIndex] = innerValue;
          var toRespond = this.toRespond;
          if (toRespond.length > 0) {
              var found = toRespond.indexOf(outerIndex);
              if (found !== -1) {
                  toRespond.splice(found, 1);
              }
          }
      };
      WithLatestFromSubscriber.prototype.notifyComplete = function () {
      };
      WithLatestFromSubscriber.prototype._next = function (value) {
          if (this.toRespond.length === 0) {
              var args = [value].concat(this.values);
              if (this.project) {
                  this._tryProject(args);
              }
              else {
                  this.destination.next(args);
              }
          }
      };
      WithLatestFromSubscriber.prototype._tryProject = function (args) {
          var result;
          try {
              result = this.project.apply(this, args);
          }
          catch (err) {
              this.destination.error(err);
              return;
          }
          this.destination.next(result);
      };
      return WithLatestFromSubscriber;
  }(OuterSubscriber));
  //# sourceMappingURL=withLatestFrom.js.map

  /** PURE_IMPORTS_START _observable_zip PURE_IMPORTS_END */
  //# sourceMappingURL=zip.js.map

  /** PURE_IMPORTS_START _observable_zip PURE_IMPORTS_END */
  //# sourceMappingURL=zipAll.js.map

  /** PURE_IMPORTS_START  PURE_IMPORTS_END */
  //# sourceMappingURL=index.js.map

  function addInstalledHandler(handler) {
    chrome.runtime.onInstalled.addListener(handler);
  }

  function onInstalled() {
    return fromEventPattern(addInstalledHandler).pipe(take(1));
  }

  function addUpdatedHandler(handler) {
    chrome.tabs.onUpdated.addListener(handler);
  }

  function onUpdated() {
    return fromEventPattern(addUpdatedHandler).pipe(map(([tabId, {
      favIconUrl
    }, {
      active,
      url
    }]) => ({
      tabId,
      favIconUrl,
      active,
      url
    })));
  }

  function addQueryActiveTabHandler(handler) {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, handler);
  }

  function queryActiveTab() {
    return fromEventPattern(addQueryActiveTabHandler).pipe(take(1));
  }

  function addActivatedHandler(handler) {
    chrome.tabs.onActivated.addListener(handler);
  }

  function onActivated() {
    return fromEventPattern(addActivatedHandler);
  }

  function onActivatedTab() {
    return onActivated().pipe(switchMap(() => queryActiveTab()), map(([{
      id,
      url
    }]) => ({
      id,
      url
    })));
  }

  function addCompletedHandler(handler) {
    chrome.webNavigation.onCompleted.addListener(handler);
  }

  function onCompleted() {
    return fromEventPattern(addCompletedHandler).pipe(map(({
      frameId
    }) => frameId));
  }

  function addHistoryStateUpdatedHandler(handler) {
    chrome.webNavigation.onHistoryStateUpdated.addListener(handler);
  }

  function onHistoryStateUpdated() {
    return fromEventPattern(addHistoryStateUpdatedHandler);
  }

  function filterNavigation(getState$, navigation) {
    const {
      url
    } = navigation;
    return getState$().pipe(map(({
      browserURL
    }) => browserURL), filter(browserURL => url !== undefined && url !== browserURL), map(() => navigation));
  }

  function onCompletedTab() {
    const getActiveTab$ = queryActiveTab().pipe(filter(tabs => tabs.length > 0));
    const onNavigationCompleted$ = onCompleted().pipe(filter(frameId => frameId === 0), switchMap(() => getActiveTab$), map(([{
      id,
      url
    }]) => ({
      id,
      url
    })));
    const onNavigationHistoryStateUpdated$ = onHistoryStateUpdated().pipe(switchMap(() => getActiveTab$), map(([{
      id,
      url
    }]) => ({
      id,
      url
    })), switchMap(navigation => filterNavigation(StateManager.getState$, navigation)));
    return merge(onNavigationCompleted$, onNavigationHistoryStateUpdated$);
  }

  function addNotificationsButtonClickedHandler(handler) {
    chrome.notifications.onButtonClicked.addListener(handler);
  }

  function onNotificationsButtonClicked() {
    return fromEventPattern(addNotificationsButtonClickedHandler).pipe(tap(x => console.log('button clicked', x)), map(([notificationId, buttonIndex]) => ({
      notificationId,
      buttonIndex
    })), tap(x => console.log('button clicked', x)));
  }

  function getStorageDomain(domain) {
    return fromEventPattern(handler => {
      chrome.storage.local.get([domain], handler);
    }).pipe(take(1), map(result => result && result[domain] ? JSON.parse(result[domain]) : {}));
  }

  function setStorageDomain(domain, domainState) {
    return fromEventPattern(handler => {
      chrome.storage.local.set({
        [domain]: JSON.stringify(domainState)
      }, handler);
    }).pipe(take(1));
  }

  const onUpdateItemMapping = [{
    [ITEM_STATUS.DECREASED]: onTrackWithDecreasedPriceClick,
    [ITEM_STATUS.INCREASED]: onTrackWithIncreasedPriceClick
  }, {
    [ITEM_STATUS.DECREASED]: onStopTrackClick,
    [ITEM_STATUS.INCREASED]: onStopTrackClick
  }];

  function onTrackWithDecreasedPriceClick(item) {
    item.updateTrackStatus(item.price, null, [ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE], true);
    return item;
  }

  function onTrackWithIncreasedPriceClick(item) {
    item.updateTrackStatus(item.previousPrice, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE], true);
    return item;
  }

  function onStopTrackClick(item) {
    item.updateTrackStatus(null, null, ITEM_STATUS.ALL_STATUSES); // stop watching

    return item;
  }

  function getNotification$(getState$, notificationId) {
    return getState$().pipe(map(state => state.notifications[notificationId]));
  }

  function listenNotificationsButtonClicked() {
    return onNotificationsButtonClicked().pipe( // get notification object
    switchMap(({
      notificationId,
      buttonIndex
    }) => getNotification$(StateManager.getState$, notificationId).pipe(map(notification => ({
      notification,
      buttonIndex
    })))), // get domain state for the item if exists
    switchMap(({
      notification,
      buttonIndex
    }) => {
      const {
        domain,
        url,
        type
      } = notification;
      return getStorageDomain(domain, url).pipe(filter(domainState => domainState[url]), map(domainState => ({
        domainState,
        domain,
        url,
        type,
        buttonIndex
      })));
    }), // update item in its storage domain state according to click type
    switchMap(({
      domainState,
      domain,
      url,
      type,
      buttonIndex
    }) => {
      const item = ItemFactory.createItemFromObject(domainState[url]);
      const updateItemFn = get_1(onUpdateItemMapping, [buttonIndex, type]);

      if (isFunction_1(updateItemFn)) {
        domainState[url] = updateItemFn(item);
        return setStorageDomain(domain, domainState);
      } else {
        return of();
      }
    }));
  }

  StateManager.initState(TIME);

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
        const {
          canonicalURL,
          browserURL
        } = StateManager.getState();
        const payload = buildURLConfirmationPayload(canonicalURL, browserURL, domain);
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
          const {
            canonicalURL,
            browserURL
          } = StateManager.getState();

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
                    const {
                      canonicalURL
                    } = StateManager.getState();
                    StateManager.updateCurrentURL(canonicalURL);
                    callback(true, true);
                  });
                  break;

                case 1:
                  // said Yes, but use canonical just this time
                  StateManager.updateCurrentURL(canonicalURL);
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
                    const {
                      browserURL
                    } = StateManager.getState();
                    StateManager.updateCurrentURL(browserURL);
                    callback(true, false);
                  });
                  break;

                case 3:
                  // said No, use browser URL but ask again
                  StateManager.updateCurrentURL(browserURL);
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
    } = StateManager.getState();

    if (status > 0) {
      const State = StateManager.getState();
      StateManager.updateFaviconURL(State, State.faviconURL || faviconURL);
      canDisplayURLConfirmation(State, domain, canDisplay => {
        if (canDisplay) {
          onConfirmURLForCreateItemAttempt(tabId, domain, currentURL, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
            if (canSave) {
              const State = StateManager.getState();
              const url = useCaninocal ? State.canonicalURL : State.browserURL;
              checkForURLSimilarity(tabId, domain, url, isToSave => {
                if (isToSave) {
                  const State = StateManager.getState();
                  createItem(domain, url, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
                  updateExtensionAppearance(domain, url, true);
                }
              });
            }
          });
        } else {
          checkForURLSimilarity(tabId, domain, currentURL, isToSave => {
            if (isToSave) {
              const State = StateManager.getState();
              createItem(domain, currentURL, selection, price, State.faviconURL, faviconAlt, [ITEM_STATUS.WATCHED]);
              updateExtensionAppearance(domain, currentURL, true);
            }
          });
        }
      });
      StateManager.disableRecord();
    }
  }

  function onRecordCancel() {
    StateManager.disableRecord();
  }

  function onAutoSaveCheckStatus(sendResponse, {
    status,
    selection,
    price,
    faviconURL,
    faviconAlt
  } = {}) {
    if (status >= 0) {
      const State = StateManager.getState();
      StateManager.updateFaviconURL(State.faviconURL || faviconURL);
      StateManager.setSelectionInfo(selection, price, State.faviconURL, faviconAlt);
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
      const State = StateManager.getState();
      StateManager.updateFaviconURL(State.faviconURL || faviconURL);
      StateManager.setSelectionInfo(selection, price, State.faviconURL, faviconAlt);

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
      StateManager.setSimilarElementHighlight(isSimilarElementHighlighted, originalBackgroundColor);
    }
  }

  function createItem(domain, url, selection, price, faviconURL, faviconAlt, statuses, callback) {
    chrome.storage.local.get([domain], result => {
      const items = result && result[domain] ? JSON.parse(result[domain]) : {};
      items[url] = ItemFactory.createItem(selection, toPrice(price), null, faviconURL, faviconAlt, statuses);
      chrome.storage.local.set({
        [domain]: JSON.stringify(items)
      }, () => {
        StateManager.disableAutoSave();

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
                            const {
                              notificationsCounter
                            } = StateManager.getState();
                            const notificationId = `TRACK.PRICE_FIXED-${notificationsCounter}`;
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
                              const {
                                notificationsCounter
                              } = StateManager.getState();
                              const notificationId = `TRACK.PRICE_UPDATE-${notificationsCounter}`;
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
                              const {
                                notificationsCounter
                              } = StateManager.getState();
                              const notificationId = `TRACK.PRICE_UPDATE-${notificationsCounter}`;
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
                          const {
                            notificationsCounter
                          } = StateManager.getState();
                          const notificationId = `TRACK.PRICE_NOT_FOUND-${notificationsCounter}`;
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
                        const {
                          notificationsCounter
                        } = StateManager.getState();
                        const notificationId = `TRACK.PRICE_NOT_FOUND-${notificationsCounter}`;
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
          const item = domainItems[url] && ItemFactory.createItemFromObject(domainItems[url]);

          if (item) {
            found = true;
            const {
              _undoRemovedItemsResetTask
            } = StateManager.getState();

            if (_undoRemovedItemsResetTask) {
              clearTimeout(_undoRemovedItemsResetTask);
              StateManager.setUndoRemovedItemsResetTask(null);
            }

            const removedItem = _objectSpread({}, item);

            StateManager.addUndoRemovedItem(url, removedItem, MAX_UNDO_REMOVED_ITEMS);
            chrome.runtime.sendMessage({
              type: "TRACKED_ITEMS.UNDO_STATUS",
              payload: {
                isUndoStatusActive: true
              }
            });
            const undoRemovedItemsTask = setTimeout(() => {
              StateManager.resetUndoRemovedItems();
              chrome.runtime.sendMessage({
                type: "TRACKED_ITEMS.UNDO_STATUS",
                payload: {
                  isUndoStatusActive: false
                }
              });
            }, UNDO_REMOVED_ITEMS_TIMEOUT);
            StateManager.setUndoRemovedItemsResetTask(undoRemovedItemsTask);
            item.updateTrackStatus(null, null, [ITEM_STATUS.WATCHED]); // stop watching

            domainItems[url] = item;
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
          const item = domainItems[url] && ItemFactory.createItemFromObject(domainItems[url]);

          if (item) {
            found = true;
            item.updateTrackStatus(null, [ITEM_STATUS.WATCHED], null); // start watch again

            domainItems[url] = item;
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
          notifications
        } = StateManager.getState();
        const {
          domain,
          url,
          type
        } = notifications[notifId];
        chrome.storage.local.get([domain], result => {
          const domainItems = result && result[domain] ? JSON.parse(result[domain]) : null;
          const item = ItemFactory.createItemFromObject(domainItems[url]);

          switch (type) {
            case ITEM_STATUS.DECREASED:
              item.updateTrackStatus(null, [ITEM_STATUS.ACK_DECREASE]);
              break;

            case ITEM_STATUS.INCREASED:
              item.updateTrackStatus(null, [ITEM_STATUS.ACK_INCREASE]);
              break;
          }

          domainItems[url] = item;
          chrome.storage.local.set({
            [domain]: JSON.stringify(domainItems)
          });
        });
      }

      StateManager.deleteNotificationsItem(notifId);
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
      StateManager.updateNotificationsItem(id, {
        url,
        domain,
        type
      });
    });
    StateManager.incrementNotificationsCounter();
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
        const urlFromDomain = findURLKey(items);
        const exampleFromDomain = items[urlFromDomain] && ItemFactory.createItemFromObject(items[urlFromDomain]);

        if (exampleFromDomain && exampleFromDomain.selection) {
          StateManager.enableAutoSave(exampleFromDomain.selection);
        }
      } else {
        StateManager.disableAutoSave();
      }
    });
  }

  function updatePriceUpdateStatus(url, domain, fullURL) {
    chrome.storage.local.get([domain], result => {
      const items = result && result[domain] ? JSON.parse(result[domain]) : {};
      const item = items[url] && ItemFactory.createItemFromObject(items[url]) || items[fullURL] && ItemFactory.createItemFromObject(items[fullURL]);
      const hasItemPriceIncOrDec = item && item.price !== item.currentPrice;

      if (hasItemPriceIncOrDec) {
        StateManager.enablePriceUpdate(item.selection);
      } else {
        StateManager.disablePriceUpdate();
      }
    });
  }

  function updateExtensionAppearance(currentDomain, currentURL, forcePageTrackingTo, fullURL) {
    if (forcePageTrackingTo === true) {
      setTrackedItemAppearance();
      StateManager.enableCurrentPageTracked();
    } else if (forcePageTrackingTo === false) {
      setDefaultAppearance();
      StateManager.disableCurrentPageTracked();
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
            StateManager.enableCurrentPageTracked();
          } else {
            setDefaultAppearance();
            StateManager.disableCurrentPageTracked();
          }
        } else {
          setDefaultAppearance();
          StateManager.disableCurrentPageTracked();
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

  function onTabContextChange(tabId, url) {
    const captureDomain = url.match(MATCHES.CAPTURE.DOMAIN_IN_URL);

    if (captureDomain) {
      const [, domain] = captureDomain;
      StateManager.updateCurrentDomain(domain);
      chrome.storage.local.get([domain], result => {
        const domainState = result && result[domain] && JSON.parse(result[domain]) || null; // check if user has already a preference to use the canonical URL if available

        if (domainState && domainState._canUseCanonical === false) {
          StateManager.updateCanonicalURL(null);
          StateManager.updateCurrentURL(url);
          StateManager.updateBrowserURL(url);

          if (domainState._isPathEnoughToTrack === true) {
            const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);

            if (protocolHostAndPathFromURL) {
              StateManager.updateCurrentURL(protocolHostAndPathFromURL);
              StateManager.updateBrowserURL(protocolHostAndPathFromURL);
            }
          }

          const State = StateManager.getState();
          updateAutoSaveStatus(State.currentURL, State.domain, url);
          updatePriceUpdateStatus(State.currentURL, State.domain, url);
          updateExtensionAppearance(State.domain, State.currentURL, null, url);
        } else {
          // First thing to do, check:
          // If canonical was updated (compared to the previously) + if it's relevant
          StateManager.updateBrowserURL(url);
          onXHR(url, template => {
            const canonicalURL = getCanonicalPathFromSource(template);
            const canUseCanonical = isCanonicalURLRelevant(canonicalURL);

            if (canUseCanonical) {
              StateManager.updateCurrentURL(canonicalURL);
              StateManager.updateCanonicalURL(canonicalURL);
            } else {
              StateManager.updateCanonicalURL(null);
              StateManager.updateCurrentURL(url);

              if (domainState && domainState._isPathEnoughToTrack === true) {
                const protocolHostAndPathFromURL = captureProtocolHostAndPathFromURL(url);

                if (protocolHostAndPathFromURL) {
                  StateManager.updateCurrentURL(protocolHostAndPathFromURL);
                  StateManager.updateBrowserURL(protocolHostAndPathFromURL);
                }
              }
            }

            const State = StateManager.getState();
            updateAutoSaveStatus(State.currentURL, State.domain, url);
            updatePriceUpdateStatus(State.currentURL, State.domain, url);
            updateExtensionAppearance(State.domain, State.currentURL, null, url);
          });
        }
      });
    }
  } // TODO: break this down into smaller functions


  function attachEvents() {
    onInstalled().subscribe(() => {
      console.log("Price tag installed.");
    });
    onActivatedTab().subscribe(({
      id,
      url
    }) => {
      if (url.startsWith("http")) {
        onTabContextChange(id, url);
        const State = StateManager.getState();
        StateManager.updateFaviconURL(State._faviconURLMap[id] || null);
      } else {
        setDefaultAppearance();
      }
    });
    onUpdated().subscribe(({
      tabId,
      favIconUrl,
      active,
      url
    }) => {
      if (url.startsWith("http")) {
        if (active && favIconUrl) {
          StateManager.updateFaviconURLMapItem(tabId, favIconUrl);
          StateManager.updateFaviconURL(favIconUrl);
        }
      } else {
        setDefaultAppearance();
      }
    });
    onCompletedTab().subscribe(({
      id,
      url
    }) => {
      onTabContextChange(id, url);
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
        domain,
        _sortItemsBy,
        _undoRemovedItems
      } = StateManager.getState();

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
          /* eslint-disable no-case-declarations */
          const {
            recordActive: isRecordActive
          } = StateManager.toggleRecord();
          /* eslint-enable no-case-declarations */

          if (isRecordActive) {
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
              recordActive: isRecordActive
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
                    const {
                      selection
                    } = StateManager.getState();
                    chrome.tabs.sendMessage(id, {
                      type: "AUTO_SAVE.CHECK_STATUS",
                      payload: {
                        url,
                        selection
                      }
                    }, onAutoSaveCheckStatus.bind(null, sendResponse));
                  } else {
                    sendResponse({
                      status: -1
                    });
                  }
                });
              } else {
                const {
                  selection
                } = StateManager.getState();
                chrome.tabs.sendMessage(id, {
                  type: "AUTO_SAVE.CHECK_STATUS",
                  payload: {
                    url,
                    selection
                  }
                }, onAutoSaveCheckStatus.bind(null, sendResponse));
              }
            } else {
              // domain doesn't exist
              const {
                selection
              } = StateManager.getState();
              chrome.tabs.sendMessage(id, {
                type: "AUTO_SAVE.CHECK_STATUS",
                payload: {
                  url,
                  selection
                }
              }, onAutoSaveCheckStatus.bind(null, sendResponse));
            }
          });
          return true;

        case "AUTO_SAVE.ATTEMPT":
          if (autoSaveEnabled) {
            const {
              domain,
              currentURL: stateUrl,
              selection,
              price,
              faviconURL,
              faviconAlt,
              originalBackgroundColor
            } = StateManager.getState();
            canDisplayURLConfirmation(StateManager.getState(), domain, canDisplay => {
              if (canDisplay) {
                onConfirmURLForCreateItemAttempt(id, domain, stateUrl, selection, price, faviconURL, faviconAlt, (canSave, useCaninocal) => {
                  if (canSave) {
                    const {
                      canonicalURL,
                      browserURL
                    } = StateManager.getState();
                    const url = useCaninocal ? canonicalURL : browserURL;
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
                          StateManager.disableAutoSave();
                          sendResponse(false);
                        });
                      } else {
                        // For Exceptions (including when there's similar item - should be caught by "AUTO_SAVE.STATUS")
                        if (!autoSaveStatus) {
                          StateManager.disableAutoSave();
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
                      StateManager.disableAutoSave();
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
          if (autoSaveEnabled) {
            const {
              selection
            } = StateManager.getState();
            chrome.tabs.sendMessage(id, {
              type: "PRICE_TAG.HIGHLIGHT.START",
              payload: {
                selection
              }
            }, onSimilarElementHighlight);
          }

          break;

        case "AUTO_SAVE.HIGHLIGHT.PRE_STOP":
          if (autoSaveEnabled) {
            const {
              selection,
              originalBackgroundColor
            } = StateManager.getState();
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
          chrome.storage.local.get([domain], result => {
            const {
              domain,
              currentURL,
              browserURL,
              selection
            } = StateManager.getState();
            const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
            const item = domainItems[currentURL] && ItemFactory.createItemFromObject(domainItems[currentURL]) || domainItems[browserURL] && ItemFactory.createItemFromObject(domainItems[browserURL]);

            if (item) {
              chrome.tabs.sendMessage(id, {
                type: "PRICE_UPDATE.CHECK_STATUS",
                payload: {
                  selection
                }
              }, onPriceUpdateCheckStatus.bind(null, sendResponse, item.price));
            } else {
              sendResponse(false);
            }
          });
          return true;

        case "PRICE_UPDATE.ATTEMPT":
          if (isPriceUpdateEnabled) {
            const {
              selection,
              price: updatedPrice,
              originalBackgroundColor
            } = StateManager.getState();
            const price = updatedPrice && toPrice(updatedPrice);
            chrome.storage.local.get([domain], result => {
              const domainItems = result && result[domain] ? JSON.parse(result[domain]) : {};
              const item = ItemFactory.createItemFromObject(domainItems[url]);
              item.updateTrackStatus(price, null, [ITEM_STATUS.INCREASED, ITEM_STATUS.ACK_INCREASE, ITEM_STATUS.DECREASED, ITEM_STATUS.INCREASED, ITEM_STATUS.DECREASED, ITEM_STATUS.ACK_DECREASE, ITEM_STATUS.DECREASED, ITEM_STATUS.DECREASED, ITEM_STATUS.NOT_FOUND]);
              item.updateDiffPercentage();
              domainItems[url] = item;
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
              StateManager.disablePriceUpdate();
              sendResponse(false);
            });
          }

          return true;

        case "PRICE_UPDATE.HIGHLIGHT.PRE_START":
          if (isPriceUpdateEnabled) {
            const {
              selection
            } = StateManager.getState();
            chrome.tabs.sendMessage(id, {
              type: "PRICE_TAG.HIGHLIGHT.START",
              payload: {
                selection
              }
            }, onSimilarElementHighlight);
          }

          break;

        case "PRICE_UPDATE.HIGHLIGHT.PRE_STOP":
          if (isPriceUpdateEnabled) {
            const {
              selection,
              originalBackgroundColor
            } = StateManager.getState();
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
          /* eslint-disable no-case-declarations */
          const State = StateManager.updateSortItemsBy(TIME);
          /* eslint-enable no-case-declarations */

          isUndoStatusActive = State._undoRemovedItems.length > 0;
          sendResponse({
            isUndoStatusActive
          });
          break;

        case "TRACKED_ITEMS.GET":
          getTrackedItemsSortedBy(_sortItemsBy, sendResponse);
          return true;

        case "TRACKED_ITEMS.UNFOLLOW":
          removeTrackedItem(itemUrl, url, sendResponse);
          return true;

        case "TRACKED_ITEMS.CHANGE_SORT":
          StateManager.updateSortItemsBy(SORT_BY_TYPES[sortByType]);
          break;

        case "TRACKED_ITEMS.UNDO_ATTEMPT":
          if (_undoRemovedItems.length > 0) {
            const undoRemovedItem = StateManager.getUndoRemovedItemsHead();
            undoRemoveTrackedItem(undoRemovedItem.url, State.currentURL, response => {
              if (response) {
                const {
                  _undoRemovedItems
                } = StateManager.removeUndoRemovedItem(State);
                _undoRemovedItems.length === 0 ? sendResponse({
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
      const {
        notifications
      } = StateManager.getState();
      chrome.tabs.create({
        url: notifications[notifId].url
      });
      clearNotification(notifId);
    });
    listenNotificationsButtonClicked().subscribe();
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
