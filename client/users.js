/**
 * Module dependencies.
 */

var ko = require('knockout');
var sync = require('./sync');

/**
 * Users view model.
 */

module.exports = exports = new (function () {
	var self = this;
	self.count = ko.observable();
	sync.on('users', function (count) {
		self.count(count);
	})
})();
