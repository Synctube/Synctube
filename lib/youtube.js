/**
 * Module dependencies.
 */

var config = require('../config');
var moment = require('moment');
var pjson = require('../package');
var request = require('request');

require('moment-interval');

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
 * Module exports.
 */

module.exports = exports = {

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
