/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');
var playlist = require('./playlist');

/**
 * Room ViewModel.
 */

var room = module.exports = exports = {
	playlist: playlist,
};

/**
 * Apply Knockout bindings.
 */

domready(function () {
	ko.applyBindings(room);
});
