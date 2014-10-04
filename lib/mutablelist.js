/**
 * Module dependencies.
 */

var CleanEventEmitter = require('./cleaneventemitter.js');
var util = require('util');

/**
 * Module exports.
 */

module.exports = exports = MutableList;

/**
 * Collection supporting fast concurrent insert, delete and skip-move operations.
 */

function MutableList () {
	CleanEventEmitter.call(this);

	Object.defineProperty(this, 'head', {
		value: this,
		enumerable: false,
		writable: true,
	});

	Object.defineProperty(this, 'tail', {
		value: this,
		enumerable: false,
		writable: true,
	});

	this.entries = {};
}

/**
 * Extend EventEmitter.
 */

util.inherits(MutableList, CleanEventEmitter);

/**
 * Returns the `Entry` with the given identifier, or `null` if it could not be found.
 */

MutableList.prototype.find = function (id) {
	return this.entries[id] || null;
};

/**
 * Inserts an `Entry` immediately before another entry.
 */

MutableList.prototype.insert = function (entry, before) {
	if (!before) { before = this; }
	entry.head = before;
	entry.tail = before.tail;
	entry.head.tail = entry.tail.head = entry;
	this.entries[entry.id] = entry;
	this.emit('insert', entry, before !== this ? before : null);
};

/**
 * Creates a new `Entry` with the given value and appends it to the list.
 */

MutableList.prototype.push = function (value) {
	var entry = new MutableList.Entry(value);
	this.insert(entry, this);
	return entry;
};

/**
 * Removes an `Entry` from the list.
 */

MutableList.prototype.remove = function (entry) {
	entry.head.tail = entry.tail;
	entry.tail.head = entry.head;
	entry.head = entry.tail = null;
	delete this.entries[entry.id];
	this.emit('remove', entry);
};

/**
 * Moves an `Entry` in a direction, stopping after it has skipped a list of entries.
 */

MutableList.prototype.skipmove = function (entry, forward, skip) {
	var _skip = {};
	skip.forEach(function (e) {
		_skip[e.id] = true;
	});
	var node = forward ? this.tail : this.head;
	while (node !== entry) {
		if (_skip[node.id]) {
			this.remove(entry);
			this.insert(entry, forward ? node.head : node);
			return;
		}
		node = forward ? node.tail : node.head;
	}
};

/**
 * Creates an Array containing the elements in the list.
 */

MutableList.prototype.toArray = function () {
	var array = [];
	var node = this.head;
	while (node !== this) {
		array.push(node);
		node = node.head;
	}
	return array;
};

/**
 * Creates a `MutableList` from an array of entries.
 */

MutableList.fromArray = function (array) {
	var list = new MutableList();
	array.forEach(function (entry) {
		list.insert(new MutableList.Entry(entry.value, entry.id));
	});
};

/**
 * Entry in a `MutableList`.
 */

MutableList.Entry = function (value, id) {
	Object.defineProperty(this, 'id', {
		value: id !== undefined ? id : Math.floor(Math.random() * 0xFFFFFFFF),
		enumerable: true,
		writable: false,
	});

	Object.defineProperty(this, 'value', {
		value: value,
		enumerable: true,
		writable: false,
	});

	Object.defineProperty(this, 'head', {
		value: null,
		enumerable: false,
		writable: true,
	});

	Object.defineProperty(this, 'tail', {
		value: null,
		enumerable: false,
		writable: true,
	});
};
