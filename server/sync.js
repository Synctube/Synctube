/**
 * Module dependencies.
 */

var async = require('async');
var media = require('../lib/media');
var datastore = require('./datastore');
var safesocket = require('safesocket');
var sockets = require('./sockets');

/**
 * Socket events.
 */

sockets.on('listen', function (io) {

	datastore.on('room', function (room, event, args) {
		if (event == 'state') {
			io.sockets.in(room).emit('state', args[0]);
		} else if (event == 'put') {
			io.sockets.in(room).emit('put', args[0], args[1]);
		} else if (event == 'move') {
			io.sockets.in(room).emit('move', args[0], args[1]);
		} else if (event == 'remove') {
			io.sockets.in(room).emit('remove', args[0]);
		}
	});

	datastore.on('users', function (room, count) {
		io.sockets.in(room).emit('users', count);
	});

	io.sockets.on('connection', function (socket) {
		socket.once('join', safesocket(1, function (name, callback) {
			datastore.join(name, function (err) {
				if (err) { return; }
				join(socket, name);
			});
		}));
	});

	function join (socket, name) {

		socket.join(name);

		socket.on('disconnect', function () {
			datastore.leave(name);
		});

		socket.on('add', safesocket(2, function (type, id, callback) {
			media.getLength(type, id, function (err, length) {
				if (err) { return callback(err); }
				var video = { id: id, length: length, type: type };
				datastore.addVideo(name, video, callback);
			});
		}));

		socket.on('delete', safesocket(1, function (key, callback) {
			datastore.deleteVideo(name, key, callback);
		}));

		socket.on('move', safesocket(2, function (key, beforeKey, callback) {
			datastore.moveVideo(name, key, beforeKey, callback);
		}));

		socket.on('shuffle', safesocket(0, function (callback) {
			datastore.shufflePlaylist(name, callback);
		}));

		socket.on('cue', safesocket(1, function (key, callback) {
			datastore.playVideo(name, key, callback);
		}));

		socket.on('seek', safesocket(1, function (time, callback) {
			datastore.setOffset(name, time, callback);
		}));

		socket.on('play', safesocket(0, function (callback) {
			datastore.setPlaying(name, true, callback);
		}));

		socket.on('pause', safesocket(0, function (callback) {
			datastore.setPlaying(name, false, callback);
		}));

		async.parallel({
			playlist: async.apply(datastore.getPlaylist, name),
			state: async.apply(datastore.getState, name),
			users: async.apply(datastore.getUserCount, name),
		}, function (err, result) {
			if (err) { console.warn(err); return; }
			socket.emit('playlist', result.playlist);
			socket.emit('state', result.state);
			socket.emit('users', result.users);
		});

	}

});
