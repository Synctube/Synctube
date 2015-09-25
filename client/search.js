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
			self.lastQuery(query);
			youtube.search(query, _searchResult);
		} else {
			sync.add(id);
		}
	};
	self.lastQuery = ko.observable();
	self.prevToken = ko.observable();
	self.nextToken = ko.observable();
	self.prevDisabled = ko.computed(function () { return self.prevToken() == null; });
	self.nextDisabled = ko.computed(function () { return self.nextToken() == null; });
	self.prev = function () {
		if (self.prevToken()) {
			youtube.searchPage(self.lastQuery(), self.prevToken(), _searchResult);
		}
	};
	self.next = function () {
		if (self.nextToken()) {
			youtube.searchPage(self.lastQuery(), self.nextToken(), _searchResult);
		}
	};

	function _searchResult (err, results) {
		if (err) { alert(JSON.stringify(err)); return; }
		self.prevToken(results.prevToken);
		self.nextToken(results.nextToken);
		self.results(results.items.map(function (result) { return new SearchResultViewModel(result); }));
	}
})();
