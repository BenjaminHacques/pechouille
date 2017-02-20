var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var appDir = path.dirname(require.main.filename);
var User = require('./models/user.js');

app.locals.basedir = appDir;
app.set('view engine', 'pug');
app.use(express.static('public'));

// next user id
var id = 0;
// ingame player list
var players = [];


app.get('/', function(req, res){
	res.render('index', {title: 'game'});
});


io.on('connection', function(socket){
	// Initialyze new user
	socket.my_user = new User(id++);
	console.log('User '+socket.my_user.datas.id+' connected.');
	socket.emit('user id', socket.my_user.datas.id);

	// Send login view
	app.render('connect', function(err, html) {
		socket.emit('page connect', {view: html});
	})

	// Delete this user from the game
	socket.in('fishing').on('disconnect', function(){
		socket.to('fishing').emit('bye user', socket.my_user.datas.id); // Tell all users that this user leave the game
		console.log('fisher '+socket.my_user.datas.id+' disconnected');
	});

	// User set his name and join the game
	socket.on('set pseudo', function(pseudo){
		socket.my_user.datas.pseudo = pseudo;
		console.log('user '+socket.my_user.datas.id+' set pseudo : '+pseudo);

		io.to('fishing').emit('new user', socket.my_user.datas); // Tell all users that a new one is connected
		socket.join('fishing') // Add this player to the room of players
		var players = findRoomClients('fishing'); // Get the list of current players

		// Send list of players, his id and the game view to the new player
		var datas = {
			players: players,
			user_id: socket.my_user.datas.id
		};
		app.render('game', function(err, html) {
			datas.view = html;
			socket.emit('start game', datas);
		})
		
	});

	// The player get something
	socket.in('fishing').on('peche', function(){
		console.log('user '+socket.my_user.datas.id+' action: peche');
		io.to('fishing').emit('peche', socket.my_user.datas.id);
		socket.my_user.datas.fishs++;
	});

});


http.listen(3000, function(){
	console.log('listening on *:3000');
});


function findRoomClients(roomId) {
	var res = [],
	room = io.sockets.adapter.rooms[roomId].sockets;
	if (room) {
		for (var id in room) {
			var sock = io.sockets.adapter.nsp.connected[id];
			if (sock.my_user) {
				res.push(sock.my_user.datas);
			}
		}
	}
	return res;
}