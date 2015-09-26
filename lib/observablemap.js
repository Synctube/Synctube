/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Module exports.
 */

module.exports = exports = ObservableMap;

/**
 * Abstract observable collection supporting insert, move, delete and clear operations.
 */

function ObservableMap () {
	EventEmitter.call(this);
}

/**
 * Extend EventEmitter.
 */

util.inherits(ObservableMap, EventEmitter);

/**
 * Creates an observable map with projected values.
 */

ObservableMap.prototype.map = function (f) {
	return new Projection(this, f);
};

function Projection (map, f) {
	ObservableMap.call(this);
	var self = this;
	map.on('clear', function () {
		self.emit('clear');
	});
	map.on('put', function (key, value) {
		self.emit('put', key, f(key, value));
	});
	map.on('move', function (key, before) {
		self.emit('move', key, before);
	});
	map.on('remove', function (key) {
		self.emit('remove', key);
	});
}

util.inherits(Projection, ObservableMap);

/**
 * Creates an observable map that emits a pre-event before all other events.
 */

ObservableMap.prototype.pre = function () {
	return new Pre(this);
};

function Pre (map) {
	ObservableMap.call(this);
	var self = this;
	map.on('clear', function () {
		self.emit('pre');
		self.emit('clear');
	});
	map.on('put', function (key, value) {
		self.emit('pre');
		self.emit('put', key, value);
	});
	map.on('move', function (key, before) {
		self.emit('pre');
		self.emit('move', key, before);
	});
	map.on('remove', function (key) {
		self.emit('pre');
		self.emit('remove', key);
	});
}

util.inherits(Pre, ObservableMap);
