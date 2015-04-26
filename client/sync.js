/**
 * Module dependencies.
 */

var io = require('socket.io-client');
var player = require('./player.js');
var LinkedMap = require('../lib/linkedmap.js');
var VideoState = require('../lib/videostate.js');

/**
 * Establish socket connection.
 */

var socket = io();

/**
 * Maintain a local video state.
 */

var local = new VideoState();

/**
 * Synchronize local video state with remote state updates.
 */

socket.on('state', function (state) {
	local.video = state.video;
	local.playing = state.playing;
	local.time = state.time;
});

/**
 * Synchronize local playlist with the remote.
 */

var playlist = new LinkedMap();

socket.on('playlist', function (entries) {
	playlist.clear();
	entries.forEach(function (entry) {
		playlist.put(entry.key, entry.value);
	});
});

socket.on('clear', function () {
	playlist.clear();
});

socket.on('put', function (key, value) {
	playlist.put(key, value);
});

socket.on('move', function (key, before) {
	playlist.move(key, before);
});

socket.on('remove', function (key) {
	playlist.remove(key);
});

/**
 * Synchronize player with local video state.
 */

player.on('ready', function () {

	local.on('play', function () {
		player.play();
	});

	local.on('pause', function () {
		player.pause();
	});

	local.on('change', function () {
		syncVideo();
	});

	local.on('seek', function () {
		syncTime(false);
	});

	player.on('change', function () {
		resync(false);
	});

	resync(true);

	setInterval(function () {
		resync(false);
	}, 200);

	function resync (always) {
		syncVideo();
		syncPlaying();
		syncTime(always);
	}

	function syncVideo () {
		if (local.video && (player.getVideo() !== local.video.id)) {
			player.load(local.video, local.time);
		}
	}

	function syncPlaying () {
		if (player.isPlaying() !== local.playing) {
			if (local.playing) {
				player.play();
			} else {
				player.pause();
			}
		}
	}

	function syncTime (always) {
		var delta = Math.abs(player.getTime() - local.time);
		if ((player.isPlaying() && (delta > 0.55)) || (always && (delta > 0))) {
			player.seek(local.time);
		}
	}

});

/**
 * Module exports.
 */

 var sync = module.exports = exports = {
 	playlist: playlist,
 	state: local,
 	cue: function (key) {
		socket.emit('cue', key);
	},
	remove: function (key) {
		socket.emit('delete', key);
	},
	add: function (id) {
		socket.emit('add', id);
	},
	seek: function (time) {
		socket.emit('seek', time);
	},
	playpause: function () {
		socket.emit('playpause');
	},
 };
