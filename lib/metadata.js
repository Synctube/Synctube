/**
 * Module dependencies.
 */

var pjson = require('../package.json');
var request = require('request');

/**
 * Module exports.
 */

module.exports = exports = {

	/**
	 * Augments a `Video` instance with metadata.
	 */

	load: function (video, callback) {
		request({
			uri: 'http://gdata.youtube.com/feeds/api/videos/' + video.id + '?v=2&alt=jsonc',
			headers: {
				'User-Agent': pjson.name + '/' + pjson.version,
			},
			json: true,
		}, function (err, res, body) {
			err = err || body.error;
			if (err) { callback(err); return; }
			video.length = body.data.duration;
			callback(null);
		});
	},
};
