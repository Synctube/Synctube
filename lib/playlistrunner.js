/**
 * Module dependencies.
 */

var LinkedMap = require('./linkedmap.js');
var VideoState = require('./videostate.js');

/**
 * Module exports.
 */

module.exports = exports = PlaylistRunner;

/**
 * Executes a playlist with configurable delays and playing options.
 */

function PlaylistRunner () {
	this.state = new VideoState();
	this.playlist = new LinkedMap();
	this.options = {
		autoplay: true,
		loop: false,
		predelay: 1,
		postdelay: 1,
	};

	Object.defineProperty(this, 'current', {
		get: function () {
			return _current;
		},
		enumerable: true,
	});

	var self = this;
	var _timer = null;
	var _current = null;
	var _changing = false;

	function clearTimer() {
		if (_timer) {
			clearTimeout(_timer);
			_timer = null;
		}
	}

	this.state.on('play', clearTimer);
	this.state.on('pause', clearTimer);
	this.state.on('seek', clearTimer);
	this.state.on('change', clearTimer);

	this.state.on('change', function () {
		if (!_changing) { _current = null; }
	});

	this.state.on('finish', function () {
		if (!self.options.autoplay) { return; }
		if (!_current) { return; }
		_timer = setTimeout(function () {
			_timer = null;
			var next = self.playlist.after(_current.key);
			if (next === undefined) {
				return;
			} else if (next === null) {
				if (!self.options.loop) { return; }
				next = self.playlist.first();
			}
			if (next) {
				self.cueVideo(next);
			}
		}, self.options.predelay * 1000);
	});

	/**
	 * Cues a video to be played.
	 */

	this.cueVideo = function (entry) {
		_current = entry;
		_changing = true;
		this.state.video = entry.value;
		this.state.playing = false;
		this.state.time = 0;
		_changing = false;
		clearTimer();
		_timer = setTimeout(function () {
			_timer = null;
			self.state.playing = true;
		}, this.options.postdelay * 1000);
	};
}
