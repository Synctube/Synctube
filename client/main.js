/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');
var playlist = require('./playlist.js');
var rooms = require('./rooms.js');

/**
 * Module exports.
 */

var room = module.exports = exports = {
	playlist: playlist,
	rooms: rooms,
};

domready(function () {
	ko.applyBindings(room);
});
