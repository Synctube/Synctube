/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

/**
 * Module exports.
 */

module.exports = exports = MutableList;

/**
 * Collection supporting fast concurrent insert, delete and skip-move operations.
 */

function MutableList () {
	EventEmitter.call(this);
	this.head = this.tail = this;
	this.entries = {};
}

/**
 * Extend EventEmitter.
 */

util.inherits(MutableList, EventEmitter);

/**
 * Returns the `Entry` with the given identifier, or `null` if it could not be found.
 */

MutableList.prototype.find = function (id) {
	return this.entries[id] || null;
};

/**
 * Clears the list.
 */

MutableList.prototype.clear = function () {
	var node = this.head;
	while (node !== this) {
		_remove(node);
		node = this.head;
	}
	this.entries = {};
	this.emit('clear');
	return this;
};

/**
 * Inserts an `Entry` immediately before another entry.
 */

MutableList.prototype.insert = function (entry, before) {
	if (!before) { before = this; }
	_insert(entry, before);
	this.entries[entry.id] = entry;
	this.emit('insert', entry, before !== this ? before : null);
};

/**
 * Inserts a node immediately before another node.
 */

function _insert (entry, before) {
	entry.head = before;
	entry.tail = before.tail;
	entry.head.tail = entry.tail.head = entry;
}

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
	_remove(entry);
	delete this.entries[entry.id];
	this.emit('remove', entry);
};

/**
 * Extracts a node from the list.
 */

function _remove (entry) {
	entry.head.tail = entry.tail;
	entry.tail.head = entry.head;
	entry.head = entry.tail = null;
}

/**
 * Moves an `Entry` immediately before another entry.
 */

MutableList.prototype.move = function (entry, before) {
	if (!before) { before = this; }
	_remove(entry);
	_insert(entry, before);
	this.emit('move', entry, before !== this ? before : null);
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
	return list;
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
