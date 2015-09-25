/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');
var controls = require('./controls');
var playlist = require('./playlist');
var search = require('./search');

/**
 * Room ViewModel.
 */

var room = module.exports = exports = {
	controls: controls,
	playlist: playlist,
	search: search,
};

/**
 * Apply Knockout bindings.
 */

domready(function () {
	ko.applyBindings(room);
});
