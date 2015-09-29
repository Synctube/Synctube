/**
 * Module exports.
 */

module.exports = exports = {
	listen: {
		port: process.argv[2] || process.env.PORT,
	},
	youtube: {
		apiKey: process.env.SYNCTUBE_SERVER_YOUTUBE_APIKEY,
		batchDelay: parseInt(process.env.SYNCTUBE_YOUTUBE_BATCH_DELAY),
		batchLimit: parseInt(process.env.SYNCTUBE_YOUTUBE_BATCH_LIMIT),
	},
};
