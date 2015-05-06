/**
 * Module dependencies.
 */

var asyncevent = require('../lib/asyncevent');
var youtube = require('../lib/youtube');
var PlaylistRunner = require('../lib/playlistrunner');
var rooms = require('../lib/rooms');
var safesocket = require('safesocket');
var sockets = require('./sockets');
var url = require('url');

/**
 * Augment rooms with PlaylistRunner.
 */

rooms.on('create', function (room) {
	room.runner = new PlaylistRunner();
});

rooms.on('destroy', function (room) {
	room.runner.state.video = null;
});

/**
 * Message formatters.
 */

function sendState (targets, runner) {
	targets.emit('state', runner.state);
}

/**
 * Socket events.
 */

sockets.on('listen', function (io) {

	rooms.on('create', function (room) {
		var runner = room.runner;

		runner.playlist.on('clear', function () {
			io.sockets.in(room.name).emit('clear');
		});

		runner.playlist.on('put', function (key, value) {
			io.sockets.in(room.name).emit('put', key, value);
		});

		runner.playlist.on('move', function (key, before) {
			io.sockets.in(room.name).emit('move', key, before);
		});

		runner.playlist.on('remove', function (key) {
			io.sockets.in(room.name).emit('remove', key);
		});

		var changed = asyncevent(function () {
			sendState(io.sockets.in(room.name), runner);
		});

		['play', 'pause', 'seek', 'change'].forEach(function (emitter) {
			runner.state.on(emitter, changed);
		});
	});

	io.sockets.on('connection', function (socket) {

		var name = unescape(url.parse(socket.handshake.headers.referer || '').pathname.split('/')[2]);

		socket.join(name);

		var room = rooms.get(name).add(socket);
		var runner = room.runner;

		socket.on('disconnect', function () {
			room.remove(socket);
		});

		socket.on('clear', safesocket(0, function (callback) {
			runner.playlist.clear();
			callback();
		}));

		socket.on('add', safesocket(1, function (id, callback) {
			youtube.getVideoLength(id, function (err, length) {
				if (err) { return callback(err); }
				var video = { id: id, length: length };
				callback(null, runner.playlist.push(video));
			});
		}));

		socket.on('delete', safesocket(1, function (key, callback) {
			var removed = runner.playlist.remove(key);
			callback(removed);
		}));

		socket.on('move', safesocket(2, function (key, beforeKey, callback) {
			var success = runner.playlist.move(key, beforeKey);
			callback(success);
		}));

		socket.on('cue', safesocket(1, function (key, callback) {
			var entry = runner.playlist.getNode(key)
			if (entry) {
				runner.cueVideo(entry);
			}
			callback(entry);
		}));

		socket.on('seek', safesocket(1, function (time, callback) {
			runner.state.time = time;
			callback();
		}));

		socket.on('playpause', safesocket(0, function (callback) {
			runner.state.playing = !runner.state.playing;
			callback();
		}));

		socket.emit('playlist', runner.playlist.getNodes());
		sendState(socket, runner);
	});

});
