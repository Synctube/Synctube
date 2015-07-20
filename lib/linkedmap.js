/**
 * Module dependencies.
 */

var ObservableMap = require('./observablemap');
var util = require('util');

/**
 * Module exports.
 */

module.exports = exports = LinkedMap;

/**
 * Key/value collection supporting fast insert, lookup, move and delete operations.
 */

function LinkedMap () {
	ObservableMap.call(this);
	this.head = this.tail = this;
	this.entries = {};
	this.key = null;
}

/**
 * Extend ObservableMap.
 */

util.inherits(LinkedMap, ObservableMap);

/**
 * Returns the first key in the list, or null if the list is empty.
 */

LinkedMap.prototype.first = function () {
	return this.head.key;
};

/**
 * Returns the last key in the list, or null if the list is empty.
 */

LinkedMap.prototype.last = function () {
	return this.tail.key;
};

/**
 * Returns the key before the given key, or null if that key is the first.
 */

LinkedMap.prototype.before = function (key) {
	var node = this.entries[key];
	if (!node) {
		return undefined;
	}
	return node.tail.key;
};

/**
 * Returns the key after the given key, or null if that key is the last.
 */

LinkedMap.prototype.after = function (key) {
	var node = this.entries[key];
	if (!node) {
		return undefined;
	}
	return node.head.key;
};

/**
 * Returns the value associated with the given key, or null if there is none.
 */

LinkedMap.prototype.get = function (key) {
	var node = this.entries[key];
	return node ? node.value : null;
};

/**
 * Returns the node associated with the given key, or null if there is none.
 */

LinkedMap.prototype.getNode = function (key) {
	var node = this.entries[key];
	return node ? _clone(node) : null;
};

/**
 * Returns an array of all values.
 */

LinkedMap.prototype.getValues = function () {
	var array = [];
	this.forEach(function (node) {
		array.push(node.value);
	});
	return array;
};

/**
 * Returns an array of all keys.
 */

LinkedMap.prototype.getKeys = function () {
	var array = [];
	this.forEach(function (node) {
		array.push(node.key);
	});
	return array;
};

/**
 * Returns an array of all nodes.
 */

LinkedMap.prototype.getNodes = function () {
	var array = [];
	this.forEach(function (node) {
		array.push(node);
	});
	return array;
};

/**
 * Clears the list.
 */

LinkedMap.prototype.clear = function () {
	this.head = this.tail = this;
	this.entries = {};
	this.emit('clear');
	return this;
};

/**
 * Associates a value with a key, updating the key if it already exists.
 */

LinkedMap.prototype.put = function (key, value) {
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

LinkedMap.prototype.push = function (value) {
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

LinkedMap.prototype.remove = function (key) {
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

LinkedMap.prototype.move = function (key, before) {
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

LinkedMap.prototype.forEach = function (f) {
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

/**
 * Creates a linked map reflecting an observable collection's changes.
 */

ObservableMap.prototype.collect = function () {
	var map = new LinkedMap();
	this.on('clear', function () {
		map.clear(); 
	});
	this.on('put', function (key, value) {
		map.put(key, value);
	});
	this.on('move', function (key, before) {
		map.move(key, before);
	});
	this.on('remove', function (key) {
		map.remove(key);
	});
	return map;
};
