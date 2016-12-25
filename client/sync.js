/**
 * Module dependencies.
 */

var io = require('socket.io-client');
var player = require('./player');
var LinkedMap = require('../lib/linkedmap');
var Simulation = require('../lib/simulation');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Local playlist and state simulation.
 */

var playlist = new LinkedMap();
var simulation = new Simulation(playlist);

simulation.on('state', function (state) {
	sync.emit('state', state);
});

/**
 * Establish socket connection.
 */

var socket = io();

socket.on('connect', function () {

	/**
	 * Synchronize local playlist with the remote.
	 */

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

	socket.on('state', function (state) {
		simulation.setState(state);
	});

	/**
	 * Emit user count updates.
	 */

	socket.on('users', function (count) {
		sync.emit('users', count);
	});

	/**
	 * Join room.
	 */

	var name = decodeURIComponent(window.location.pathname.split('/')[2]);
	socket.emit('join', name);

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
 * Sync module interface.
 */

function Sync () {
	EventEmitter.call(this);
	this.playlist = playlist.emitter();
}

util.inherits(Sync, EventEmitter);

Sync.prototype.cue = function (key) {
	socket.emit('cue', key);
};

Sync.prototype.remove = function (key) {
	socket.emit('delete', key);
};

Sync.prototype.add = function (type, id) {
	socket.emit('add', type, id);
};

Sync.prototype.move = function (key, beforeKey) {
	socket.emit('move', key, beforeKey);
};

Sync.prototype.moveUp = function (key) {
	var before = playlist.before(key);
	this.move(key, before);
};

Sync.prototype.shuffle = function () {
	socket.emit('shuffle');
};

Sync.prototype.seek = function (time) {
	socket.emit('seek', time);
};

Sync.prototype.play = function () {
	socket.emit('play');
};

Sync.prototype.pause = function () {
	socket.emit('pause');
};

var sync = module.exports = exports = new Sync();
