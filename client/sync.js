/**
 * Module dependencies.
 */

var player = require('./player.js');
var Video = require('../lib/Video.js');
var VideoState = require('../lib/VideoState.js');

/**
 * Establish socket connection.
 */

var roomName = window.location.pathname.split('/')[2];

var socket = io.connect(null, {
	query: $.param({ room: roomName }),
});

/**
 * Maintain a local video state.
 */

var local = new VideoState();

/**
 * Synchronize local video state with remote state updates.
 */

socket.on('state', function (state) {
	local.video = state.video ? new Video(state.video.id, state.video.length) : null;
	local.playing = state.playing;
	local.time = state.time;
});

/**
 * Synchronize player with local video state.
 */

player.on('ready', function () {

	local.on('play', function () {
		player.play()
	});

	local.on('pause', function () {
		player.pause()
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
				player.play()
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
