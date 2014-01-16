/**
 * Module dependencies.
 */

var pjson = require('./package.json');
var request = require('request');
var VideoData = require('./videodata.js');

/**
 * Module exports.
 */

module.exports = exports = {

	/**
	 * Creates an object with metadata for the given video.
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
			callback(null, new VideoData(video, body.data.duration));
		});
	},
};
