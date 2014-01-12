/**
 * Module dependencies.
 */

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
 * Extend Video.
 */

VideoData.prototype = Object.create(Video.prototype);
