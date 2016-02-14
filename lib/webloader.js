var _               = require('lodash'),
    request         = require('request'),
    extend          = require('extend'),
    Promise         = require('bluebird'),
    CrawlerDocument = require('./document'),
    Url             = require('fast-url-parser');
    Url.queryString = require('querystringparser');

/**
 * @typedef {{}} WebLoader~options
 * @property {WebLoader~options.request|Function} [request]
 * @property {WebLoader~options.convert|Function} [convert]
 */

/**
 * @typedef {{}} WebLoader~options.request
 * @property {string} [url=]
 * @property {string} [encoding=binary]
 */

/**
 * @typedef {{}} WebLoader~options.convert
 * @property {string} [from=]
 * @property {string} [to=utf8]
 */

/**
 * @callback WebLoader~loadCallback
 * @param {string|null} err
 * @param {WebLoaderDocument} [document]
 * @returns {*}
 */

/** @type {WebLoader~options} */
var defaults = {
  convert: {
    from: '',
    to: 'utf8'
  },
  request: {
    url: '',
    encoding: 'binary'
  }
};

/**
 * @param {WebLoader~options} [options]
 * @returns {WebLoader}
 * @constructor
 */
var WebLoader = function (options) {
  if (!(this instanceof WebLoader)) {
    return new WebLoader(options);
  }

  /** @type {WebLoader~options} */
  this.options = this._normalizeOptions(options || {});

  return this;
};

/**
 * @param {*} [options]
 * @returns {WebLoader~options}
 * @private
 */
WebLoader.prototype._normalizeOptions = function (options) {
  options = (_.isPlainObject(options)) ? options : {};
  options = extend(true, {}, defaults, options);

  return options;
};

/**
 * @param {string} base
 * @param {string} url
 * @returns {string}
 */
WebLoader.prototype.resolve = function (base, url) {
  return Url.resolve(base, url);
};

/**
 * @param {string} [url]
 * @param {WebLoader~options} [options]
 * @param {WebLoader~loadCallback} [cb]
 * @returns {Promise|*}
 */
WebLoader.prototype.load = function (url, options, cb) {
  var args      = _.toArray(arguments),
      _url      = '',
      _options  = {},
      _cb       = _.noop;

  switch (args.length) {
    case 1:
      if (_.isString(args[0])) {
        _url = args[0];
      } else if (_.isPlainObject(args[0])) {
        _options = args[0];
      }

      break;
    case 2:
      if (_.isString(args[0])) {
        _url = args[0];
      } else if (_.isPlainObject(args[0])) {
        _options = options;
      }

      if (_.isPlainObject(args[1])) {
        _options = options;
      } else if (_.isFunction(args[1])) {
        _cb = args[1];
      }

      break;
    case 3:
    // downfall
    default:
      if (_.isString(args[0])) {
        _url = args[0];
      }

      if (_.isPlainObject(args[1])) {
        _options = options;
      }

      if (_.isFunction(args[2])) {
        _cb = args[1];
      }

      break;
  }

  url     = _url;
  options = _options;
  cb      = _cb;

  var convertOptions = options.convert || {};
  if (_.isFunction(convertOptions)) {
    convertOptions = convertOptions();
  }
  convertOptions = (_.isPlainObject(convertOptions)) ? convertOptions : {};
  convertOptions = extend(true, {}, this.options.convert, convertOptions);

  var requestOptions = options.request || {};
  if (_.isFunction(requestOptions)) {
    requestOptions = requestOptions();
  }
  requestOptions = (_.isPlainObject(requestOptions)) ? requestOptions : {};
  requestOptions = extend(true, {}, this.options.request, requestOptions);

  requestOptions.url = (url) ? url : requestOptions.url || '';
  if (!requestOptions.url) {
    throw new Error('[WebLoader][load] Invalid arguments - "url" is required!');
  }

  options = extend(true, {}, {
    convert: convertOptions,
    request: requestOptions
  });

  return new Promise(function (resolve, reject) {
    request(options.request, (function (options) {
      return function (err, response) {
        if (err) {
          reject(err);
          return cb(err);
        }

        var document = new CrawlerDocument(response, options);

        resolve(document);
        cb(null, document);
      };
    })(options));
  });
};

module.exports = WebLoader;