/**
 * Module dependencies.
 */

var ko = require('knockout');
var moment = require('moment');
var sync = require('./sync.js');
var request = require('request');
var config = require('../config.json');
var youtube = require('../lib/youtube.js');

require('moment-duration-format');

/**
 * Module exports.
 */

module.exports = exports = function () {

/**
 * Instantiate sync module.
 */

sync = sync();

/**
 * ViewModel for an individual playlist entry.
 */

function PlaylistEntryViewModel(entry) {
	var self = this;

	var key = self.key = entry.key;
	var videoId = entry.value.id;
	var length = entry.value.length;

	self.title = ko.observable();
	self.length = moment.duration(length, 'seconds').format();
	self.thumbnail = ko.observable();

	self.play = function () {
		sync.cue(key);
	};

	self.remove = function () {
		sync.remove(key);
	};

	request({
		uri: 'https://www.googleapis.com/youtube/v3/videos',
		qs: {
			part: 'snippet',
			id: videoId,
			key: config.youtube.serverApiKey,
		},
		json: true,
	}, function (err, res, body) {
		err = err || body.error;
		if (err) { return; }
		if (body.items.length === 0) { return; }
		var item = body.items[0].snippet;
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

var playlist = new (function () {
	var self = this;
	self.entries = ko.observableArray();
	self.link = ko.observable('');
	self.add = function () {
		if (!self.valid()) { return; }
		var id = youtube.parseUrl(self.link());
		sync.add(id);
		self.link('');
	};
	self.valid = ko.computed(function() {
		return youtube.parseUrl(self.link()) !== null;
	});
	self.seek = function () {
		sync.seek(moment.duration(self.seekTime()).asSeconds());
	};
	self.seekTime = ko.observable('');
	self.playpause = function () {
		sync.playpause();
	};
	self.playing = ko.observable(false);
	sync.state.on('play', function () {
		self.playing(sync.state.playing);
	});
	sync.state.on('pause', function () {
		self.playing(sync.state.playing);
	});
})();

return playlist;

};
