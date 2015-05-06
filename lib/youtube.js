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
 * Module exports.
 */

module.exports = exports = {

	/**
	 * Gets video length in seconds.
	 */

	getVideoLength: function (id, callback) {
		if (!validId.test(id)) {
			return callback('Invalid video ID');
		}
		request({
			uri: 'https://www.googleapis.com/youtube/v3/videos',
			qs: {
				part: 'contentDetails',
				id: id,
				key: config.youtube.serverApiKey,
			},
			headers: {
				'User-Agent': pjson.name + '/' + pjson.version,
			},
			json: true,
		}, function (err, res, body) {
			err = err || body.error;
			if (err) { callback(err); return; }
			if (body.items.length === 0) { callback('Invalid video ID'); return; }
			var item = body.items[0];
			var length = moment.duration(item.contentDetails.duration).asSeconds();
			callback(null, length);	
		});
	},

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
};
