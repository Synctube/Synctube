/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');

/**
 * Browse view model.
 */

function BrowseViewModel () {
	var self = this;
	self.name = ko.observable('');
	self.create = function () {
		var name = encodeURIComponent(self.name());
		if (name) {
			window.location.pathname = '/rooms/' + name;
		}
	};
}

/**
 * Apply Knockout bindings.
 */

domready(function () {
	ko.applyBindings(new BrowseViewModel());
});
