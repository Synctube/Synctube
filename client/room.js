/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');
var playlist = require('./playlist');
var search = require('./search');

/**
 * Room ViewModel.
 */

var room = module.exports = exports = {
	playlist: playlist,
	search: search,
};

/**
 * Apply Knockout bindings.
 */

domready(function () {
	ko.applyBindings(room);
});
