/**
 * Module exports.
 */

module.exports = exports = MutableList;

/**
 * Collection supporting fast concurrent insert, delete and skip-move operations.
 */

function MutableList () {
	this.head = this.tail = this;
	this.entries = {};
}

/**
 * Returns the `Entry` with the given identifier, or `null` if it could not be found.
 */

MutableList.prototype.find = function (id) {
	return this.entries[id] || null;
};

/**
 * Creates a new `Entry` with the given value and appends it to the list.
 */

MutableList.prototype.push = function (value) {
	var entry = new Entry(value);
	entry.head = this;
	entry.tail = this.tail;
	entry.head.tail = entry.tail.head = entry;
	this.entries[entry.id] = entry;
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
	while (node != entry) {
		if (_skip[node.id]) {
			this.remove(entry);
			entry.head = forward ? node.head : node;
			entry.tail = entry.head.tail;
			entry.head.tail = entry.tail.head = entry;
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
	while (node != this) {
		array.push(node);
		node = node.head;
	}
	return array;
};

/**
 * Entry in a `MutableList`.
 */

function Entry (value) {
	Object.defineProperty(this, 'id', {
		value: Math.floor(Math.random() * 0xFFFFFFFF),
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
}
