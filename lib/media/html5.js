/**
 * Module dependencies.
 */

var validUrl = require('valid-url');
var ffprobe = require('node-ffprobe');

/**
 * Html5 media plugin constructor.
 */

function Html5 () {
}

module.exports = exports = Html5;

/**
 * Gets the length (in seconds) of a video by its ID.
 */

Html5.prototype.getLength = function (id, callback) {
	ffprobe(id, function (err, data) {
		if (err) {
			console.warn(err);
			return callback('probe failed; see server log');
		}
		return data.format.duration;
	});
};

/**
 * Gets display details of a video by its ID.
 */

Html5.prototype.getDetails = function (id, callback) {
	callback(null, {
		title: '[Video]',
		thumbnail: 'https://i.imgur.com/I5EBXgz.png',
	});
};

/**
 * Videojs technology name to play this media.
 */

Html5.prototype.technologyName = 'html5';

/**
 * Produces a Videojs source object for the given ID.
 */

Html5.prototype.formatSource = function formatSource (id) {
	return { type: 'video/x-msvideo', src: id };
};

/**
 * Checks for a valid HTTP/S URL.
 */

Html5.prototype.parseUrl = function parseUrl (str) {
	if (validUrl.isHttpUri(str)) {
		return str;
	} else {
		return null;
	}
};
