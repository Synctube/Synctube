/**
 * Module dependencies.
 */

var config = require('../config');
var moment = require('moment');
var pjson = require('../package');
var request = require('request');
var url = require('url');

require('moment-interval');

/**
 * YouTube ID validation.
 * See: http://markmail.org/message/jb6nsveqs7hya5la#query:+page:1+mid:jb6nsveqs7hya5la+state:results
 */

var validId = /^[a-zA-Z0-9_-]{11}$/;

/**
 * YouTube video search. Accepts arbitrary API options.
 */

function _search (opts, callback) {

	opts.part = 'snippet';
	opts.maxResults = 8;
	opts.type = 'video';
	opts.videoEmbeddable = true;
	opts.key = config.youtube.apiKey;

	request({
		uri: 'https://www.googleapis.com/youtube/v3/search',
		qs: opts,
		headers: {
			'User-Agent': pjson.name + '/' + pjson.version,
		},
		json: true,
	}, function (err, res, body) {
		err = err || body.error;
		if (err) { callback(err); return; }

		var items = body.items;
		var prevToken = body.prevPageToken;
		var nextToken = body.nextPageToken;

		request({
			uri: 'https://www.googleapis.com/youtube/v3/videos',
			qs: {
				part: 'contentDetails',
				id: body.items.map(function (item) { return item.id.videoId; }).join(','),
				key: config.youtube.apiKey,
			},
			headers: {
				'User-Agent': pjson.name + '/' + pjson.version,
			},
			json: true,
		}, function (err, res, body) {
			err = err || body.error;
			if (err) { callback(err); return; }

			var lengths = {};
			for (var i = 0; i < body.items.length; i++) {
				var item = body.items[i];
				lengths[item.id] = moment.duration(item.contentDetails.duration).asSeconds();
			}

			var obj = {
				items: items.map(function (item) { return { item: item, length: lengths[item.id.videoId] }; }),
				prevToken: prevToken,
				nextToken: nextToken,
			}

			callback(null, obj);
		});
	});
}

/**
 * Multi-video videos/list query.
 */

function _listVideos (ids, part, selector) {
	var reqs = [];
	Object.keys(ids).forEach(function (id) {
		if (!validId.test(id)) {
			var cb = ids[id];
			process.nextTick(function () {
				cb('Invalid video ID');
			});
			delete ids[id];
		} else {
			reqs.push(id);
		}
	});

	request({
		uri: 'https://www.googleapis.com/youtube/v3/videos',
		qs: {
			part: part,
			id: reqs.join(','),
			key: config.youtube.apiKey,
		},
		headers: {
			'User-Agent': pjson.name + '/' + pjson.version,
		},
		json: true,
	}, function (err, res, body) {
		err = err || body.error;
		if (err) {
			Object.keys(ids).forEach(function (id) {
				var cb = ids[id];
				cb(err);
			});
			return;
		}

		body.items.forEach(function (item) {
			var cb = ids[item.id];
			if (cb) {
				delete ids[item.id];
				cb(null, selector(item));
			}
		});

		for (id in ids) {
			var cb = id[ids];
			cb('Invalid video ID');
		}
	});
}

/**
 * Utilities for batching requests.
 */

function _timeBatch (delay, max, func) {
	var batch = [];
	var timer = null;
	return function () {
		var args = [];
		for (var i = 0; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		batch.push(args);
		if (batch.length == max) {
			var _batch = batch;
			batch = [];
			process.nextTick(function () {
				func(_batch);
			});
			return;
		}
		if (!timer) {
			timer = setTimeout(function () {
				var _batch = batch;
				batch = [];
				timer = null;
				if (_batch.length == 0) { return; }
				func(_batch);
			}, delay);
		}
	};
}

function _groupCalls (reqs) {
	var ids = {};
	reqs.forEach(function (req) {
		var id = req[0];
		var cb = req[1];
		var prev = ids[id];
		if (prev) {
			ids[id] = function (err, res) {
				prev(err, res);
				cb(err, res);
			};
		} else {
			ids[id] = cb;
		}		
	});
	return ids;
}

/**
 * Module exports.
 */

module.exports = exports = {

	/**
	 * Gets video length (in seconds) for multiple videos. Keys are IDs, values are callbacks.
	 */

	getVideoLength: _timeBatch(config.youtube.batchDelay, config.youtube.batchLimit, function (reqs) {
		var ids = _groupCalls(reqs);
		_listVideos(ids, 'contentDetails', function (item) {
			return moment.duration(item.contentDetails.duration).asSeconds();
		});
	}),

	/**
	 * Gets snippet for multiple videos. Keys are IDs, values are callbacks.
	 */

	getVideoSnippet: _timeBatch(config.youtube.batchDelay, config.youtube.batchLimit, function (reqs) {
		var ids = _groupCalls(reqs);
		_listVideos(ids, 'snippet', function (item) {
			return item.snippet;
		});
	}),

	/**
	 * Gets video ID from YouTube URL.
	 */

	parseUrl: function (str) {
		var parsed = url.parse(str, true);
		if (parsed.hostname === 'youtu.be') {
			var matches = parsed.pathname.match(/^\/([a-zA-Z0-9-_]{11})$/i);
			if (matches) {
				return matches[1];
			}
		} else if (parsed.hostname === 'www.youtube.com') {
			if (parsed.pathname === '/watch' || parsed.pathname === '/') {
				if (/^[a-zA-Z0-9-_]{11}$/i.test(parsed.query.v)) {
					return parsed.query.v;
				}
			}
			var matches = parsed.pathname.match(/^\/(?:v|e(?:mbed)?)\/([a-zA-Z0-9-_]{11})$/i);
			if (matches) {
				return matches[1];
			}
		}
		return null;
	},

	/**
	 * Searches for YouTube videos by string query.
	 */

	search: function (query, callback) {
		_search({ q: query }, callback);
	},

	/**
	 * Searches for YouTube videos by page token.
	 */

	searchPage: function (query, token, callback) {
		_search({ q: query, pageToken: token }, callback);
	},

};
