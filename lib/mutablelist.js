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
	this.key = null;
}

/**
 * Extend EventEmitter.
 */

util.inherits(MutableList, EventEmitter);

/**
 * Returns the first node in the list, or null if the list is empty.
 */

MutableList.prototype.first = function () {
	var node = this.head;
	return node !== this ? _clone(node) : null;
};

/**
 * Returns the last node in the list, or null if the list is empty.
 */

MutableList.prototype.last = function () {
	var node = this.tail;
	return node !== this ? _clone(node) : null;
};

/**
 * Returns the node before the given key, or null if that key is the first.
 */

MutableList.prototype.before = function (key) {
	var node = this.entries[key];
	if (!node) {
		return undefined;
	}
	node = node.tail;
	return node !== this ? _clone(node) : null;
};

/**
 * Returns the node after the given key, or null if that key is the last.
 */

MutableList.prototype.after = function (key) {
	var node = this.entries[key];
	if (!node) {
		return undefined;
	}
	node = node.head;
	return node !== this ? _clone(node) : null;
};

/**
 * Returns the value associated with the given key, or null if there is none.
 */

MutableList.prototype.get = function (key) {
	var node = this.entries[key];
	return node ? node.value : null;
};

/**
 * Returns the node associated with the given key, or null if there is none.
 */

MutableList.prototype.getNode = function (key) {
	var node = this.entries[key];
	return node ? _clone(node) : null;
};

/**
 * Returns an array of all values.
 */

MutableList.prototype.getValues = function () {
	var array = [];
	this.forEach(function (node) {
		array.push(node.value);
	});
	return array;
};

/**
 * Returns an array of all keys.
 */

MutableList.prototype.getKeys = function () {
	var array = [];
	this.forEach(function (node) {
		array.push(node.key);
	});
	return array;
};

/**
 * Returns an array of all nodes.
 */

MutableList.prototype.getNodes = function () {
	var array = [];
	this.forEach(function (node) {
		array.push(node);
	});
	return array;
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
 * Associates a value with a key, updating the key if it already exists.
 */

MutableList.prototype.put = function (key, value) {
	if (key == null) {
		return false;
	}
	var node = this.entries[key];
	if (node) {
		node.value = value;
	} else {
		node = _create(key, value);
		_insert(node, this);
		this.entries[key] = node;
	}
	this.emit('put', key, value);
	return true;
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
 * Inserts a value with a random key. Returns the key used.
 */

MutableList.prototype.push = function (value) {
	var key;
	var i = 0;
	do {
		if (i++ > 20) {
			throw new Error('keyspace exhausted');
		}
		key = Math.floor(Math.random() * 0xFFFFFFFF);
	} while (this.entries[key]);
	this.put(key, value);
	return key;
};

/**
 * Removes a key and its associated value from the list. Returns the removed value, or null if the key was not found.
 */

MutableList.prototype.remove = function (key) {
	var node = this.entries[key];
	if (!node) {
		return null;
	}
	_remove(node);
	delete this.entries[key];
	this.emit('remove', key);
	return node.value;
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
 * Moves a key immediately before another key.
 */

MutableList.prototype.move = function (key, before) {
	var node = this.entries[key];
	if (!node) {
		return false;
	}
	var beforeNode = this;
	if (before) {
		beforeNode = this.entries[before];
		if (!beforeNode) {
			return false;
		}
	}
	if (node.head !== beforeNode) {
		_remove(node);
		_insert(node, beforeNode);
		this.emit('move', key, beforeNode.key);	
	}
	return true;
};

/**
 * Invokes a function for each node in the list.
 * 
 * Aborts iteration if the function returns true. Returns whether iteration was aborted.
 */

MutableList.prototype.forEach = function (f) {
	var node = this.head;
	var i = 0;
	while (node !== this) {
		if (f(_clone(node), i++)) {
			return true;
		}
		node = node.head;
	}
	return false;
};

/**
 * Creates a node with the given key and value.
 */

function _create (key, value) {
	return {
		key: key,
		value: value,
	};
}

/**
 * Clones a node.
 */

function _clone (node) {
	return _create(node.key, node.value);
}
