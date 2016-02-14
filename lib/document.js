var _               = require('lodash'),
    unquote         = require('underscore.string/unquote'),
    cheerio         = require('cheerio'),
    extend          = require('extend'),
    encoding        = require('encoding'),
    charset         = require('charset'),
    jsChardet       = require('jschardet'),
    Url             = require('fast-url-parser');
    Url.queryString = require('querystringparser');

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
 * @param {*} [options]
 * @returns {WebLoader~options}
 */
var normalizeOptions = function (options) {
  options = (_.isPlainObject(options)) ? options : {};
  options = extend(true, {}, defaults, options);

  return options;
};

/**
 * @param {*} response
 * @param {WebLoader~options} [options]
 * @returns {WebLoaderDocument}
 * @constructor
 */
var WebLoaderDocument = function (response, options) {
  if (!(this instanceof WebLoaderDocument)) {
    return new WebLoaderDocument(response, options);
  }

  var self = this;

  /** @type WebLoader~options */
  this._query   = null;
  this.options  = normalizeOptions(options || {});
  this.response = response;
  this.request  = this.response.request;
  this.body     = this.response.body;
  this.url      = Url.format(this.request.uri);
  this.baseUrl  = (function () {
    var result,
        baseUrl = '',
        regexp  = /<base .*?href=(.*?)( |\/?>)/ig;

    while (result = regexp.exec(self.body)) {
      baseUrl = _.trim(baseUrl);
      baseUrl = unquote(result[1], '"');
      baseUrl = unquote(result[1], "'");
      baseUrl = _.trim(baseUrl);
    }

    return (baseUrl) ? baseUrl : self.url;
  })();

  this._convert();

  return this;
};


WebLoaderDocument.prototype = {
  constructor: WebLoaderDocument,

  /**
   * @returns {string}
   * @private
   */
  _convert: function () {
    var bodyBufConverted, bodyBuffer;

    if (this.body && this.options.convert.to && this.options.request.encoding && this.options.request.encoding == 'binary') {
      bodyBuffer = new Buffer(this.body, 'binary');

      if (!this.options.convert.from) {
        this.options.convert.from = charset(this.response.headers, bodyBuffer) || jsChardet.detect(body).encoding.toLowerCase();
      }

      bodyBufConverted = encoding.convert(bodyBuffer, this.options.convert.to, this.options.convert.from);
      this.body = bodyBufConverted.toString();
    }

    return this.body;
  },

  /**
   * @param {string} uri
   * @returns {string}
   */
  resolve: function (uri) {
    return Url.resolve(this.baseUrl, uri);
  },

  get $() {
    if (!this._query) {
      this._query = cheerio.load(this.body);
    }

    return this._query;
  }
};

module.exports = WebLoaderDocument;
