/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');

/**
 * Module exports.
 */

var rooms = module.exports = exports = new (function () {
	var self = this;
	self.name = ko.observable('');
	self.create = function () {
		var name = encodeURI(self.name());
		if (name) {
			window.location.pathname = '/rooms/' + name;
		}
	};
})();

domready(function () {
	ko.applyBindings(rooms);
});
