/**
 * Module dependencies.
 */

var ko = require('knockout');
var moment = require('moment');
var sync = require('./sync');
var youtube = require('../lib/youtube');

require('moment-duration-format');

/**
 * Duration formatting.
 */

function formatDuration (d) {
	return d.format(d.asHours() < 1 ? 'm:ss' : 'h:mm:ss', { trim: false });
}

/**
 * ViewModel for an individual playlist entry.
 */

function PlaylistEntryViewModel(entry) {
	var self = this;

	var key = self.key = entry.key;
	var videoId = entry.value.id;
	var length = entry.value.length;

	self.title = ko.observable();
	self.length = formatDuration(moment.duration(length, 'seconds'));
	self.thumbnail = ko.observable();

	self.isCurrent = ko.computed(function () {
		return key == playlist.currentKey();
	});

	self.play = function () {
		sync.cue(key);
	};

	self.remove = function () {
		sync.remove(key);
	};

	self.moveUp = function () {
		var before = sync.playlist.before(key);
		sync.move(key, before);
	};

	youtube.getVideoSnippet(videoId, function (err, item) {
		if (err) { return; }
		self.title(item.title);
		self.thumbnail(item.thumbnails.default.url);
	});
}

/**
 * Observe sync playlist and map it to playlist entry view models.
 */

var entries = sync.playlist.map(function (key, value) { return new PlaylistEntryViewModel({ key: key, value: value }); }).collect();

/**
 * Observe mapped playlist and update Knockout observable.
 */

function updatePlaylist () {
	playlist.entries(entries.getValues());
}

entries.on('clear', updatePlaylist);
entries.on('put', updatePlaylist);
entries.on('move', updatePlaylist);
entries.on('remove', updatePlaylist);

/**
 * Playlist view model.
 */

var playlist = module.exports = exports = new (function () {
	var self = this;
	self.entries = ko.observableArray();
	self.currentKey = ko.observable(null);
	sync.state.on('state', function () {
		var state = sync.state.getState();
		self.currentKey(state.key || null);
	});
	self.shuffle = function () {
		sync.shuffle();
	};
})();
