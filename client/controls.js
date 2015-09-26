/**
 * Module dependencies.
 */

var ko = require('knockout');
var moment = require('moment');
var sync = require('./sync');

/**
 * Controls view model.
 */

module.exports = exports = new (function () {
	var self = this;
	self.seek = function () {
		sync.seek(moment.duration(self.seekTime()).asSeconds());
	};
	self.seekTime = ko.observable('');
	self.playpause = function () {
		if (self.playing()) {
			sync.pause();
		} else {
			sync.play();
		}
	};
	self.playing = ko.observable(false);
	sync.state.on('state', function () {
		var state = sync.state.getState();
		self.playing(state.playing);
	});
})();
