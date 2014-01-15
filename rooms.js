/**
 * Module dependencies.
 */

var events = require('events');
var Room = require('./room.js');

/**
 * Hash of all active rooms.
 */

var _rooms = {};

/**
 * Module exports.
 */

var rooms = module.exports = exports = {

	/**
	 * Gets a `Room` by name, creating it if necessary.
	 */

	get: function (name) {
		var room = _rooms[name];
		if (!room) {
			room = _rooms[name] = new Room(name);
			room.on('empty', destroy);
			rooms.emit('create', room);
		}
		return room;
	},

	/**
	 * Returns a list of active rooms.
	 */

	toArray: function () {
		var arr = [];
		for (var name in _rooms) {
			arr.push(_rooms[name]);
		}
		return arr;
	},
};

function destroy () {
	delete _rooms[this.name];
	rooms.emit('destroy', this);
}

/**
 * Extend EventEmitter.
 */

rooms.__proto__ = events.EventEmitter.prototype;
events.EventEmitter.call(rooms);
