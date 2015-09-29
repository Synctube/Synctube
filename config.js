/**
 * Module exports.
 */

module.exports = exports = {
	listen: {
		port: process.env.PORT,
	},
	youtube: {
		apiKey: process.env.SYNCTUBE_SERVER_YOUTUBE_APIKEY,
		batchDelay: parseInt(process.env.SYNCTUBE_YOUTUBE_BATCH_DELAY),
	},
};
