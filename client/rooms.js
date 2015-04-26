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
		window.location.pathname = '/rooms/' + encodeURI(self.name());
	};
})();

domready(function () {
	ko.applyBindings(rooms);
});
