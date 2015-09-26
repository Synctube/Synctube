/**
 * Module dependencies.
 */

var events = require('events');

/**
 * YouTube player.
 */

var tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var youtube;
window.onYouTubeIframeAPIReady = function () {
	youtube = new YT.Player('player', {
		playerVars: {
			rel: 0,
			showinfo: 0,
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange,
		},
	});
};

function onPlayerReady (event) {
	player.emit('ready');
}

function onPlayerStateChange (event) {
	player.emit('change');
}

/**
 * Player module interface.
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
		var data = youtube.getVideoData();
		return data ? data.video_id : null;
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
