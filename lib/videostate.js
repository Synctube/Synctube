/**
 * Module dependencies.
 */

var CleanEventEmitter = require('./cleaneventemitter.js');
var Video = require('./video.js');

/**
 * Module exports.
 */

module.exports = exports = VideoState;

/**
 * Playing state of a video.
 */

function VideoState () {
	CleanEventEmitter.call(this);

	var _video = null;
	var _playing = false;
	var _time = 0;
	var _updated = Date.now();
	var _timer = null;

	var self = this;

	/**
	 * Currently selected video, or `null` if there is no video.
	 */

	Object.defineProperty(this, 'video', {
		get: function () {
			return _video;
		},
		set: function (value) {
			if ((value !== null) && (!(value instanceof Video) || !value.hasLength())) {
				throw new TypeError('Value is not a Video augmented with metadata');
			}
			if (_video !== value) {
				this.playing = false;
				_video = value;
				updateTime(0);
				this.emit('change');
			}
		},
		enumerable: true,
	});

	/**
	 * Whether the current video is playing.
	 */

	Object.defineProperty(this, 'playing', {
		get: function () {
			return _playing;
		},
		set: function (value) {
			if (this.video === null) {
				return;
			}
			value = !!value;
			if (value != _playing) {
				updateTime(this.time);
				_playing = value;
				setTimer();
				this.emit(value ? 'play' : 'pause');
			}
		},
		enumerable: true,
	});

	/**
	 * Current position in the video.
	 */

	Object.defineProperty(this, 'time', {
		get: function () {
			return _time + (this.playing ? (Date.now() - _updated) / 1000 : 0);
		},
		set: function (value) {
			if (typeof(value) !== 'number') {
				throw new TypeError('Value is not a number');
			}
			if (this.video === null) {
				return;
			}
			var old = this.time;
			updateTime(value);
			setTimer();
			if (value !== old) {
				this.emit('seek');
			}
		},
		enumerable: true,
	});

	function updateTime (value) {
		_time = Math.min(value, _video ? _video.length : 0);
		_updated = Date.now();
	}

	function setTimer () {
		if (_timer) {
			clearTimeout(_timer);
			_timer = null;
		}
		if (self.playing) {
			_timer = setTimeout(function () {
				self.playing = false;
				self.emit('finish');
			}, (_video.length - _time) * 1000);
		}
	}
}

/**
 * Extend EventEmitter.
 */

VideoState.prototype.__proto__ = CleanEventEmitter.prototype;
