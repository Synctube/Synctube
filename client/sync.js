/**
 * Module dependencies.
 */

var io = require('socket.io-client');
var player = require('./player');
var LinkedMap = require('../lib/linkedmap');
var Simulation = require('../lib/simulation');

/**
 * Establish socket connection.
 */

var socket = io({ forceNew: true });

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
 * Synchronize local state with remote state updates.
 */

var simulation = new Simulation(playlist);

socket.on('state', function (state) {
	simulation.setState(state);
});

/**
 * Synchronize player with local state.
 */

player.on('ready', function () {

	function updatePlayer (state) {

		if (state.key == null) {
			player.pause();
			player.load({ id: null }, 0);
			return;
		}

		var video = playlist.get(state.key);

		if (player.getVideo() != video.id) {
			player.load(video, state.offset);
		} else {
			if (Math.abs(player.getTime() - state.offset) > 1) {
				player.seek(state.offset + 0.25);
			}
		}

		if (player.isPlaying() != state.playing) {
			if (state.playing) {
				player.play();
			} else {
				player.pause();
			}
		}
	}

	function fetchAndUpdate() {
		var state = simulation.getState();
		updatePlayer(state);
	}

	simulation.on('state', updatePlayer);

	var _poll = setInterval(fetchAndUpdate, 1000);

	player.on('change', function () {
		if (_poll != null) {
			clearInterval(_poll);
			_poll = null;
		}
		fetchAndUpdate();
	});

	updatePlayer(simulation.getState());

});

/**
 * Join room.
 */

var name = decodeURIComponent(window.location.pathname.split('/')[2]);
socket.emit('join', name);

/**
 * Sync module interface.
 */

module.exports = exports = {
	playlist: playlist,
	state: simulation,
	cue: function (key) {
		socket.emit('cue', key);
	},
	remove: function (key) {
		socket.emit('delete', key);
	},
	add: function (id) {
		socket.emit('add', id);
	},
	move: function (key, beforeKey) {
		socket.emit('move', key, beforeKey);
	},
	shuffle: function () {
		socket.emit('shuffle');
	},
	seek: function (time) {
		socket.emit('seek', time);
	},
	play: function () {
		socket.emit('play');
	},
	pause: function () {
		socket.emit('pause');
	},
};
