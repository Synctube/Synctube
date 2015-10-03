/**
 * Module dependencies.
 */

var moment = require('moment');
var pjson = require('../package');
var request = require('request');
var url = require('url');

require('moment-interval');

if (global.videojs) {
	require('videojs-youtube');
}

/**
 * YouTube media plugin constructor.
 */

function YouTube (opts) {
	this._opts = {};
	this._opts.batchDelay = opts.batchDelay || 50;
	this._opts.batchLimit = opts.batchLimit || 50;
	this._opts.apiKey = opts.apiKey;

	var self = this;

	/**
	 * Gets the length (in seconds) of a video by its ID.
	 */

	this.getLength = _timeBatch(this._opts.batchDelay, this._opts.batchLimit, function (reqs) {
		var ids = _groupCalls(reqs);
		self._listVideos(ids, 'contentDetails', function (item) {
			return moment.duration(item.contentDetails.duration).asSeconds();
		});
	});

	/**
	 * Gets display details of a video by its ID.
	 */

	this.getDetails = _timeBatch(this._opts.batchDelay, this._opts.batchLimit, function (reqs) {
		var ids = _groupCalls(reqs);
		self._listVideos(ids, 'snippet', function (item) {
			var snippet = item.snippet;
			return {
				title: snippet.title,
				thumbnail: snippet.thumbnails.default.url,
			};
		});
	});
}

module.exports = exports = YouTube;

/**
 * Videojs technology name to play this media.
 */

YouTube.prototype.technologyName = 'youtube';

/**
 * Produces a Videojs source object for the given ID.
 */

YouTube.prototype.formatSource = function formatSource (id) {
	return { type: 'video/youtube', src: 'https://www.youtube.com/watch?v=' + id };
};

/**
 * Gets the ID from a YouTube URL, or null if the URL is not valid.
 */

YouTube.prototype.parseUrl = function parseUrl (str) {
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
};

/**
 * YouTube ID validation.
 * See: http://markmail.org/message/jb6nsveqs7hya5la#query:+page:1+mid:jb6nsveqs7hya5la+state:results
 */

var validId = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Multi-video videos/list query.
 */

YouTube.prototype._listVideos = function _listVideos (ids, part, selector) {
	var self = this;
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
			key: self._opts.apiKey,
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
