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
	sync.on('state', function (state) {
		self.playing(state.playing);
	});
})();
