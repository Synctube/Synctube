/**
 * Module dependencies.
 */

var events = require('events');
var videojs = require('videojs');
var $ = require('jquery');

require('videojs-youtube');

/**
 * Videojs player.
 */

var vjs;
$(function () {
	vjs = videojs('player', {
		techOrder: ['youtube'],
		children: {
			bigPlayButton: false,
			controlBar: {
				children: {
					playToggle: false,
					progressControl: {
						children: {
							seekBar: {
								children: {
									seekHandle: false,
								},
							},
						},
					},
				},
			},
		},
	}, function () {
		function change () {
			process.nextTick(function () {
				player.emit('change');
			});
		}
		vjs.on('playing', change);
		vjs.on('pause', change);
		vjs.on('seeked', change);
		vjs.on('ended', change);
		player.emit('ready');
	});
});

/**
 * Player module interface.
 */

var _current;

var player = module.exports = exports = {
	play: function () {
		vjs.play();
	},
	pause: function () {
		vjs.pause();
	},
	seek: function (time) {
		vjs.currentTime(time + (this.isPlaying() ? 0.5 : 0));
	},
	load: function (video, time) {
		_current = video.id;
		vjs.src({ type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + video.id });
	},
	getVideo: function () {
		return _current;
	},
	getTime: function () {
		return vjs.currentTime();
	},
	isPlaying: function () {
		return !vjs.paused();
	},
	isEnded: function () {
		return vjs.ended();
	},
};

/**
 * Extend EventEmitter.
 */

player.__proto__ = events.EventEmitter.prototype;
events.EventEmitter.call(player);
