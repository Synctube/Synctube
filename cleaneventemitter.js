/**
 * Module dependencies.
 */

var events = require('events');

/**
 * Module exports.
 */

module.exports = exports = CleanEventEmitter;

/**
 * Hides some properties of EventEmitter by making them non-enumerable.
 */

function CleanEventEmitter () {
	events.EventEmitter.call(this);

	Object.defineProperty(this, '_events', {
		enumerable: false,
		writable: true,
	});

	Object.defineProperty(this, '_maxListeners', {
		enumerable: false,
		writable: true,
	});

	Object.defineProperty(this, 'domain', {
		enumerable: false,
		writable: true,
	});
}

/**
 * Extend EventEmitter.
 */

CleanEventEmitter.prototype.__proto__ = events.EventEmitter.prototype;
