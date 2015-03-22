/**
 * Module dependencies.
 */

var pjson = require('../package.json');
var request = require('request');

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
			uri: 'http://gdata.youtube.com/feeds/api/videos/' + id + '?v=2&alt=jsonc',
			headers: {
				'User-Agent': pjson.name + '/' + pjson.version,
			},
			json: true,
		}, function (err, res, body) {
			err = err || body.error;
			if (err) { callback(err); return; }
			callback(null, {
				id: body.data.id,
				length: body.data.duration,
			});
		});
	},
};
