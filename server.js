var express = require('express');
var app = express();
var cons = require('consolidate');

var config = require('./config');
var sockets = require('./server/sockets');
var datastore = require('./server/datastore');

var clientVersion = require('socket.io/node_modules/socket.io-client/package').version;

require('./server/sync');

app.engine('html', cons.dust);
app.set('view engine', 'html');
app.set('views', __dirname + '/template');

app.get('/', function (req, res) {
	datastore.getTopRooms(function (err, rooms) {
		if (err) {
			res.status(500);
			res.send('error');
			return;
		}
		var data = {
			rooms: rooms.map(function (room) {
				return {
					name: room.name,
					encoded: encodeURIComponent(room.name),
					connected: room.count,
				};
			}),
			socketioClientVersion: clientVersion,
		};
		res.format({
			json: function (req, res) {
				res.json(data);
			},
			html: function (req, res) {
				res.render('index', data);
			},
		});
	});
});

app.get('/rooms/:name', function (req, res) {
	res.render('room', {
		socketioClientVersion: clientVersion,
	});
});

app.use(express.static(__dirname + '/static'));

var server = app.listen(config.listen.port);
sockets.listen(server);
