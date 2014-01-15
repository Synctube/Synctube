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
 * Expiration timers.
 */

var _timers = {};

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
			room.on('empty', timeout);
			room.on('join', reset)
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

	/**
	 * Timeout (in seconds) for empty rooms.
	 */
	timeout: 30 * 60,
};

function destroy (room) {
	delete _rooms[room.name];
	delete _timers[room.name];
	rooms.emit('destroy', room);
}

function timeout () {
	_timers[this.name] = setTimeout(destroy, rooms.timeout * 1000, this);
}

function reset () {
	var timer = _timers[this.name];
	if (timer) {
		clearTimeout(timer);
		delete _timers[this.name];
	}
}

/**
 * Extend EventEmitter.
 */

rooms.__proto__ = events.EventEmitter.prototype;
events.EventEmitter.call(rooms);
