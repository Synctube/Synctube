/**
 * Module dependencies.
 */

var ko = require('knockout');

/**
 * Module exports.
 */

var rooms = module.exports = exports = new (function () {
	var self = this;
	self.name = ko.observable('');
	self.create = function () {
		var name = encodeURIComponent(self.name());
		if (name) {
			window.location.pathname = '/rooms/' + name;
		}
	};
})();
