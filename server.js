var express = require('express');
var app = express();
var mu = require('mu2');

var config = require('./config.json');
var sockets = require('./server/sockets.js');
var rooms = require('./lib/rooms.js');

var clientVersion = require('socket.io/node_modules/socket.io-client/package').version;

require('./server/sync.js');

mu.root = __dirname + '/template';

function render(res, file, data) {
	if (app.settings.env === 'development') {
		mu.clearCache(file);
	}
	mu.compileAndRender(file, data).pipe(res);
}

app.get('/', function (req, res) {
	var data = {
		rooms: rooms.toArray().map(function (room) {
			return {
				name: room.name,
				connected: Object.keys(room.connected).length,
			};
		}),
		socketioClientVersion: clientVersion,
	};
	res.format({
		json: function (req, res) {
			res.json(data);
		},
		html: function (req, res) {
			render(res, 'index.html', data);
		},
	});
});

app.get('/rooms/:name', function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
	render(res, 'room.html', {
		socketioClientVersion: clientVersion,
	});
});

app.use(express.static(__dirname + '/static'));

var server = app.listen(config.listen.port);
sockets.listen(server);
