/**
 * Module exports.
 */

module.exports = exports = {
	youtube: {
		apiKey: process.env.SYNCTUBE_CLIENT_YOUTUBE_APIKEY,
		batchDelay: parseInt(process.env.SYNCTUBE_YOUTUBE_BATCH_DELAY),
		batchLimit: parseInt(process.env.SYNCTUBE_YOUTUBE_BATCH_LIMIT),
	},
};
