/**
 * Module dependencies.
 */

var ko = require('knockout');
var moment = require('moment');
var sync = require('./sync');
var media = require('../lib/media');

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
	var type = entry.value.type;
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
		sync.moveUp(key);
	};

	media.getDetails(type, videoId, function (err, item) {
		if (err) { return; }
		self.title(item.title);
		self.thumbnail(item.thumbnail);
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
	sync.on('state', function (state) {
		self.currentKey(state.key || null);
	});
	self.shuffle = function () {
		sync.shuffle();
	};
})();
