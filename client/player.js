/**
 * Module dependencies.
 */

var events = require('events');

/**
 * YouTube player.
 */

var tag = document.createElement('script');
tag.src = '//www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var youtube;
window.onYouTubeIframeAPIReady = function () {
	youtube = new YT.Player('player', {
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange,
		},
	});
};

function onPlayerReady (event) {
	exports.emit('ready');
}

function onPlayerStateChange (event) {
	exports.emit('change');
}

/**
 * Module exports.
 */

var player = module.exports = exports = {
	play: function () {
		youtube.playVideo();
	},
	pause: function () {
		youtube.pauseVideo();
	},
	seek: function (time) {
		youtube.seekTo(time + (this.isPlaying() ? 0.5 : 0), true);
	},
	load: function (video, time) {
		youtube.loadVideoById(video.id, time);
	},
	getVideo: function () {
		return youtube.getVideoData().video_id;
	},
	getTime: function () {
		return youtube.getCurrentTime();
	},
	isPlaying: function () {
		return youtube.getPlayerState() === YT.PlayerState.PLAYING;
	},
	isEnded: function () {
		return youtube.getPlayerState() === YT.PlayerState.ENDED;
	},
};

/**
 * Extend EventEmitter.
 */

player.__proto__ = events.EventEmitter.prototype;
events.EventEmitter.call(player);
