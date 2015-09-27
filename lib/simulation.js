/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Module exports.
 */

module.exports = exports = Simulation;

/**
 * Simulates a playlist.
 */

function Simulation (source) {
	EventEmitter.call(this);

	var pre = source.pre();
	this.playlist = pre.collect();
	this._time = Date.now() / 1000;
	this._state = {};
	this._timeout = null;
	this._prev = null;

	var self = this;
	pre.on('pre', function () {
		self._updateState();
	});
}

util.inherits(Simulation, EventEmitter);

/**
 * Retrieve latest state.
 */

Simulation.prototype.getState = function () {
	this._updateState();
	return this._state;
};

/**
 * Replace simulation state with an external state.
 */

Simulation.prototype.setState = function (state) {
	this._state = state;
	this._time = Date.now() / 1000;
	this._reschedule();
	this.emit('state', state);
};

/**
 * Advance simulation to the present.
 */

Simulation.prototype._updateState = function () {
	var newTime = Date.now() / 1000;

	if (newTime < this._time) {
		newTime = this._time;
	}

	var elapsed = (newTime - this._time) + this._state.offset;
	this._time = newTime;

	if (!this._state.playing) {
		return;
	}

	var key = this._state.key;
	while (true) {
		if (key == null) {
			key = this.playlist.first();
			if (key == null) {
				this._state.key = null;
				this._state.playing = false;
				this._state.offset = 0;
				break;
			}
		}
		var video = this.playlist.get(key);
		if (video == null) {
			this._state.key = null;
			this._state.playing = false;
			this._state.offset = 0;
			break;
		}
		if (elapsed < video.length) {
			this._state.offset = elapsed;
			this._state.key = key;
			break;
		} else {
			elapsed -= video.length;
			key = this.playlist.after(key);
		}
	}
};

Simulation.prototype._reschedule = function () {

	clearTimeout(this._timeout);

	var self = this;

	function _notify () {
		if (self._prev !== self._state.key) {
			self._prev = self._state.key;
			self.emit('state', self.getState());
		}
		self._reschedule();
	}

	function _schedule () {
		var delay = self.playlist.get(self._state.key).length - self._state.offset;
		self._timeout = setTimeout(_notify, Math.max(100, delay * 1000));
	}

	if (this._state.playing && this._state.key != null) {
		_schedule();
	}

};
