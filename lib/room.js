/**
 * Module dependencies.
 */

var events = require('events');

/**
 * Module exports.
 */

module.exports = exports = Room;

/**
 * Collection of subscribed sockets.
 */

function Room (name) {
	events.EventEmitter.call(this);
	this.connected = {};
	this.name = name;
}

/**
 * Joins a socket to the room.
 */

Room.prototype.add = function (socket) {
	if (!this.connected.hasOwnProperty(socket.id)) {
		this.connected[socket.id] = socket;
		this.emit('join');
	}
	return this;
};

/**
 * Removes a socket from the room.
 */

Room.prototype.remove = function (socket) {
	if (this.connected.hasOwnProperty(socket.id)) {
		delete this.connected[socket.id];
		this.emit('leave');
		if (isEmpty(this.connected)) {
			this.emit('empty');
		}
	}
	return this;
};

function isEmpty(obj) {
	for (var key in obj) {
		if (obj.hasOwnProperty(key)) { return false; }
	}
	return true;
}

/**
 * Extend EventEmitter.
 */

Room.prototype.__proto__ = events.EventEmitter.prototype;
