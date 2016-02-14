var _               = require('lodash'),
    request         = require('request'),
    extend          = require('extend'),
    Promise         = require('bluebird'),
    Document        = require('./document'),
    Url             = require('fast-url-parser');
    Url.queryString = require('querystringparser');

/**
 * @typedef {{}} WebLoader~options
 * @property {WebLoader~options.request|Function} [request]
 * @property {WebLoader~options.convert|Function} [convert]
 * @property {WebLoader~options.cheerio|Function} [cheerio]
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
 * @typedef {{}} WebLoader~options.cheerio
 * @property {boolean} [normalizeWhitespace=false]
 * @property {boolean} [xmlMode=false]
 * @property {boolean} [decodeEntities=false]
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
  },
  cheerio: {
    decodeEntities: false
  }
};

/**
 * @param {*} [options]
 * @returns {WebLoader~options}
 */
var normalizeOptions = function (options) {
  options = (_.isPlainObject(options)) ? options : {};
  options = extend(true, {}, defaults, options);

  return options;
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
  this.options = normalizeOptions(options || {});

  return this;
};

WebLoader.prototype.constructor = WebLoader;

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

  var requestOptions = options.request || {};
  if (_.isFunction(requestOptions)) {
    requestOptions = requestOptions(url, options);
  }
  requestOptions = (_.isPlainObject(requestOptions)) ? requestOptions : {};
  requestOptions = extend(true, {}, this.options.request, requestOptions);

  requestOptions.url = (url) ? url : requestOptions.url || '';
  if (!requestOptions.url) {
    throw new Error('[WebLoader][load] Invalid arguments - "url" is required!');
  }

  var convertOptions = options.convert || {};
  if (_.isFunction(convertOptions)) {
    convertOptions = convertOptions(url, options);
  }
  convertOptions = (_.isPlainObject(convertOptions)) ? convertOptions : {};
  convertOptions = extend(true, {}, this.options.convert, convertOptions);

  var cheerioOptions = options.cheerio || {};
  if (_.isFunction(cheerioOptions)) {
    cheerioOptions = cheerioOptions(url, options);
  }
  cheerioOptions = (_.isPlainObject(cheerioOptions)) ? cheerioOptions : {};
  cheerioOptions = extend(true, {}, this.options.cheerio, cheerioOptions);

  options = extend(true, {}, {
    convert: convertOptions,
    request: requestOptions,
    cheerio: cheerioOptions
  });

  return new Promise(function (resolve, reject) {
    request(options.request, (function (options) {
      return function (err, response) {
        if (err) {
          reject(err);
          return cb(err);
        }

        var document = new Document(response, options);

        resolve(document);
        cb(null, document);
      };
    })(options));
  });
};

WebLoader.Document = Document;
WebLoader.request  = request;
WebLoader.Promise  = Promise;
WebLoader.Url      = Url;

module.exports = WebLoader;
