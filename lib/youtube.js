/**
 * Module dependencies.
 */

var config = require('../config.json');
var moment = require('moment');
var pjson = require('../package.json');
var request = require('request');

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
	 * Gets video metadata by ID.
	 */

	getVideoData: function (id, callback) {
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
			callback(null, {
				id: item.id,
				length: moment.duration(item.contentDetails.duration).asSeconds(),
			});
		});
	},
};
