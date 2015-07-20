/**
 * Module dependencies.
 */

var domready = require('domready');
var ko = require('knockout');
var playlist = require('./playlist');
var rooms = require('./rooms');

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
