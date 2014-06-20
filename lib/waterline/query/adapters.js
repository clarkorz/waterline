/**
 * Module Dependencies
 */

var _ = require('lodash');
var Deferred = require('./deferred');
var normalize = require('../utils/normalize');

/**
 * Mixes Custom Non-CRUD Adapter Methods into the prototype.
 */

module.exports = function() {
  var self = this;

  Object.keys(this.connections).forEach(function(conn) {

    var adapter = self.connections[conn]._adapter || {};

    Object.keys(adapter).forEach(function(key) {

      // Ignore the Identity Property
      if(['identity', 'tableName'].indexOf(key) >= 0) return;

      // Don't override keys that already exists
      if(self[key]) return;

      // Don't override a property, only functions
      if(typeof adapter[key] != 'function')  {
				self[key] = adapter[key];
				return;
			}

      // Apply the Function with passed in args and set this.identity as
      // the first argument
      self[key] = function(criteria /* , ...restArgs */) {
        "use strict";
        var restArgs  = _.rest(arguments);
        var tableName = self.tableName || self.identity;

        if (!_.isFunction(_.last(restArgs))) {
          return new Deferred(self, adapterMethod, criteria);
        }

        // Call adapterMethod() without callback, because callback is included
        // in `restArgs` already.
        adapterMethod(criteria);

        function adapterMethod(criteria, cb) {
          // Normalize criteria and fold in options
          criteria = normalize.criteria(criteria);

          // Concat self.identity with args (must massage arguments into a proper array)
          // Use a normalized _tableName set in the core module.
          var args = [conn, tableName, criteria].concat(restArgs);

          // Concat callback if exists
          if (cb) args = args.concat(cb);

          adapter[key].apply(self, args);
        }
      };
    });
  });

};
