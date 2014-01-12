/**
 * Module dependencies.
 */

var pjson = require('./package.json');
var request = require('request');
var Video = require('./video.js');

/**
 * Module exports.
 */

module.exports = exports = VideoData;

/**
 * Video augmented with metadata.
 */

function VideoData (video, length) {
	Video.call(this, video.id);
	this.length = length;
}

/**
 * Creates an object with metadata for the given video.
 */

VideoData.Load = function (video, callback) {
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
};

/**
 * Extend Video.
 */

VideoData.prototype = Object.create(Video.prototype);
