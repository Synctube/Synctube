/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');
var playlist = require('./playlist.js');

/**
 * Module exports.
 */

var room = module.exports = exports = {
	playlist: playlist,
};

domready(function () {
	ko.applyBindings(room);
});
