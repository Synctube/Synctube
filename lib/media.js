/**
 * Module dependencies.
 */

var config = require('../config');
var YouTube = require('./youtube-media');

/**
 * Media providers.
 */

var media = {
	youtube: new YouTube(config.youtube),
};

/**
 * Default media provider key. Should be phased out once all production datastores have been updated.
 */

var defaultKey = 'youtube';

/**
 * Media-keyed or media-agnostic methods for consumption by other modules.
 */

module.exports = exports = {

	/**
	 * Parse a string for a URL or other identifier.
	 */

	parseUrl: function parseUrl (str) {
		for (var key in media) {
			var parsed = media[key].parseUrl(str);
			if (parsed) {
				return {
					id: parsed,
					type: key,
				};
			}
		}
		return null;
	},

	/**
	 * Gets all needed Videojs technology names.
	 */

	getTechnologies: function getTechnologies (key) {
		var techs = [];
		for (var key in media) {
			techs.push(media[key].technologyName);
		}
		return techs;
	},

	/**
	 * Produces a Videojs source object for the given ID and media key.
	 */

	formatSource: function formatSource (key, id) {
		return media[key || defaultKey].formatSource(id);
	},

	/**
	 * Gets the length (in seconds) of a video by its ID and media key.
	 */

	getLength: function getLength (key, id, callback) {
		key = key || defaultKey;
		if (!(key in media)) {
			process.nextTick(function () {
				callback('Invalid media type: ' + key);
			});
			return;
		}
		media[key].getLength(id, callback);
	},

	/**
	 * Gets display details of a video by its ID and media key.
	 */

	getDetails: function getDetails (key, id, callback) {
		key = key || defaultKey;
		if (!(key in media)) {
			process.nextTick(function () {
				callback('Invalid media type: ' + key);
			});
			return;
		}
		media[key].getDetails(id, callback);
	},

};
