/**
 * Module dependencies.
 */

var asyncevent = require('../lib/asyncevent.js');
var metadata = require('./metadata.js');
var PlaylistRunner = require('../lib/playlistrunner.js');
var rooms = require('../lib/rooms.js');
var safesocket = require('safesocket');
var sockets = require('./sockets.js');
var Video = require('../lib/video.js');

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

		runner.playlist.on('insert', function (entry, before) {
			io.sockets.in(room.name).emit('insert', entry, before != null ? before.id : null);
		});

		runner.playlist.on('remove', function (entry) {
			io.sockets.in(room.name).emit('remove', entry.id);
		});

		var changed = asyncevent(function () {
			sendState(io.sockets.in(room.name), runner);
		});

		['play', 'pause', 'seek', 'change'].forEach(function (emitter) {
			runner.state.on(emitter, changed);
		});
	});

	io.sockets.on('connection', function (socket) {

		var name = unescape(socket.handshake.query.room);

		socket.join(name);

		var room = rooms.get(name).add(socket);
		var runner = room.runner;

		socket.on('disconnect', function () {
			room.remove(socket);
		});

		socket.on('add', safesocket(1, function (id, callback) {
			if (!Video.validId.test(id)) { callback(null); return; }
			var video = new Video(id);
			metadata.load(video, function (err) {
				if (err) { callback(null); return; }
				callback(runner.playlist.push(video));
			});
		}));

		socket.on('delete', safesocket(1, function (id, callback) {
			var entry = runner.playlist.find(id);
			if (entry) {
				runner.playlist.remove(entry);
			}
			callback(entry);
		}));

		socket.on('move', safesocket(3, function (id, forward, skips, callback) {
			if (!(skips instanceof Array)) { callback(null); return; }
			var entry = runner.playlist.find(id);
			if (entry) {
				runner.playlist.skipmove(entry, forward, skips);
			}
			callback(entry);
		}));

		socket.on('cue', safesocket(1, function (id, callback) {
			var entry = runner.playlist.find(id);
			if (entry) {
				runner.cueVideo(entry);
			}
			callback(entry);
		}));

		socket.emit('playlist', runner.playlist.toArray());
		sendState(socket, runner);
	});

});
