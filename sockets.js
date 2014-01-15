/**
 * Module dependencies.
 */

var events = require('events');
var socketio = require('socket.io');

/**
 * Module exports.
 */

var sockets = module.exports = exports = {

	/**
	 * Listen for socket connections on an HTTP server.
	 */

	listen: function (server) {
		var io = socketio.listen(server);
		this.emit('listen', io);
	},
};

/**
 * Extend EventEmitter.
 */

sockets.__proto__ = events.EventEmitter.prototype;
