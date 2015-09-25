/**
 * Module dependencies.
 */

var async = require('async');
var youtube = require('../lib/youtube');
var datastore = require('./datastore');
var rooms = require('../lib/rooms');
var safesocket = require('safesocket');
var sockets = require('./sockets');

/**
 * Socket events.
 */

sockets.on('listen', function (io) {

	rooms.on('create', function (room) {
		datastore.on('room:' + room.name, function (event, args) {
			if (event == 'state') {
				io.sockets.in(room.name).emit('state', args[0]);
			} else if (event == 'put') {
				io.sockets.in(room.name).emit('put', args[0], args[1]);
			} else if (event == 'move') {
				io.sockets.in(room.name).emit('move', args[0], args[1]);
			} else if (event == 'remove') {
				io.sockets.in(room.name).emit('remove', args[0]);
			}
		});
	});

	rooms.on('destroy', function (room) {
		datastore.deleteRoom(room.name);
	});

	io.sockets.on('connection', function (socket) {
		socket.once('join', safesocket(1, function (name, callback) {
			join(socket, name);
		}));
	});

	function join (socket, name) {

		socket.join(name);

		var room = rooms.get(name).add(socket);

		socket.on('disconnect', function () {
			room.remove(socket);
		});

		socket.on('add', safesocket(1, function (id, callback) {
			youtube.getVideoLength(id, function (err, length) {
				if (err) { return callback(err); }
				var video = { id: id, length: length };
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
		}, function (err, result) {
			if (err) { console.warn(err); return; }
			socket.emit('playlist', result.playlist);
			socket.emit('state', result.state);
		});

	}

});
