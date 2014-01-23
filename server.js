var express = require('express');
var app = express();
var mu = require('mu2');

var sockets = require('./server/sockets.js');

require('./server/sync.js');

mu.root = __dirname + '/template';

function render(res, file, data) {
	if (app.settings.env === 'development') {
		mu.clearCache(file);
	}
	mu.compileAndRender(file, data).pipe(res);
}

app.get('/rooms/:name', function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf8' });
	render(res, 'room.html', {});
});

app.use(express.static(__dirname + '/static'));

var server = app.listen(3000);
sockets.listen(server);
