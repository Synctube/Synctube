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
 * ViewModel for a search result.
 */

function SearchResultViewModel (result) {
	var self = this;
	var videoId = result.item.id.videoId;

	self.length = formatDuration(moment.duration(result.length, 'seconds'));
	self.title = result.item.snippet.title;
	self.thumbnail = result.item.snippet.thumbnails.default.url;

	self.add = function () {
		sync.add(videoId);
	};
}

/**
 * Search view model.
 */

module.exports = exports = new (function () {
	var self = this;
	self.link = ko.observable('');
	self.results = ko.observableArray();
	self.add = function () {
		var query = self.link();
		if (query == '') {
			self.results([]);
			return;
		}
		self.link('');
		var id = youtube.parseUrl(query);
		if (id === null) {
			youtube.search(query, function (err, results) {
				if (err) { alert(JSON.stringify(err)); return; }
				self.results(results.map(function (result) { return new SearchResultViewModel(result); }));
			});
		} else {
			sync.add(id);
		}
	};
})();
