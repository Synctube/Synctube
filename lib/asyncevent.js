/**
 * Module exports.
 */

module.exports = exports = asyncevent;

/**
 * Wraps a function such that it will only be called once per event and calling context.
 */

function asyncevent (fn) {
	var callers = [];
	var set = false;
	return function () {
		var obj = null;
		for (var i = 0; i < callers.length; i++) {
			var caller = callers[i];
			if (caller.self === this) {
				obj = caller;
				break;
			}
		}
		if (!obj) {
			obj = { self: this, args: [] };
			callers.push(obj);
		}

		obj.args.push(arguments);

		if (set) { return; }
		setImmediate(function () {
			set = false;
			var _callers = callers;
			callers = [];
			_callers.forEach(function (caller) {
				fn.call(caller.self, caller.args);
			});
		});
	}
}
