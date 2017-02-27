var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var appDir = path.dirname(require.main.filename);
var User = require('./models/user.js');
var fs = require('fs');

app.locals.basedir = appDir;
app.set('view engine', 'pug');
app.use(express.static('public'));

var params = {
	fishTiming: 5, //number of seconds you get after a fish beats to get it
	fish_percent: (process.argv[2] != null ? process.argv[2] : 5)
};
console.log(params.fish_percent+'% chance of catching fish every second');
// next user id
var id = 0;
// fish that can be catched by a user
var catchable_fishs = {};
// ingame player list
var players = {'fishing_1': {}};
var getPlayerSize = function() {
	var size = 0, key;
	for (key in players) {
		if (players.hasOwnProperty(key)) size++;
	}
	return size;
};
var getPlayerAtPosition = function(nbr) {
	var cpt = 0;
	for (key in players) {
		if (cpt == nbr) {
			return players[key];
		}
		cpt++;
	}
	return -1;
}


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
	socket.on('disconnect', function(){
		if (socket.my_user.room != '') {
			socket.to(socket.my_user.room).emit('bye user', socket.my_user.datas.id); // Tell all users that this user leave the game
			delete players[socket.my_user.datas.id];
			if (catchable_fishs[socket.my_user.datas.id] != null) {
				delete catchable_fishs[socket.my_user.datas.id];
			}
		}
		console.log('fisher '+socket.my_user.datas.id+' disconnected');
		console.log(players)
	});




	// User set his name and join the game
	socket.on('set pseudo', function(pseudo){
		if (pseudo != '') {
			socket.my_user.datas.name = pseudo;
			if (fs.existsSync('./public/img/'+pseudo.toLowerCase()+'.png') && fs.existsSync('./public/img/'+pseudo.toLowerCase()+'_front.png')) {
				socket.my_user.datas.image.back = pseudo.toLowerCase()+'.png';
				socket.my_user.datas.image.front = pseudo.toLowerCase()+'_front.png';
			}
			console.log('user '+socket.my_user.datas.id+' set pseudo : '+pseudo);

			var room = 'fishing';
			io.to(room).emit('new user', socket.my_user.datas); // Tell all users that a new one is connected
			socket.join(room); // Add this player to the room
			socket.my_user.room = room;
			players[socket.my_user.datas.id] = socket.my_user.datas;
			console.log('user '+socket.my_user.datas.id+' join room '+room);
			console.log(players)

			// Send list of players, his id and the game view to the new player
			var datas = {
				players: players,
				user_id: socket.my_user.datas.id
			};
			app.render('game', function(err, html) {
				datas.view = html;
				socket.emit('start game', datas);
			});
		} else {
			socket.emit('invalid name');
		}
		
	});




	// The player get something
	socket.on('peche', function(){
		console.log('user '+socket.my_user.datas.id+' action: peche');
		if (catchable_fishs[socket.my_user.datas.id] != null) {
			// if it's too late
			if (new Date().getTime() > catchable_fishs[socket.my_user.datas.id] + (params.fishTiming*1000)) {
				//too late
				console.log('player socket.my_user.datas.id: too late...')
				io.sockets.to(socket.my_user.room).emit('too late', socket.my_user.datas.id);
				delete catchable_fishs[socket.my_user.datas.id];
			} else {
				// he got it!
				console.log('player socket.my_user.datas.id: he got it!')
				io.sockets.to(socket.my_user.room).emit('got it', socket.my_user.datas.id);
				socket.my_user.datas.score++;
				delete catchable_fishs[socket.my_user.datas.id];
			}
		}
	});

});






// Every second check if somebody catch something and send him an event
function doesSomebodyGetSomething () {
	var player_size = getPlayerSize();
  	if (player_size > 0) {
	  	var random = Math.floor((Math.random() * 100) + 1);
	  	if (random < params.fish_percent) {
	  		var random_player = Math.floor((Math.random() * player_size));
	  		var player = getPlayerAtPosition(random_player);
	  		if (catchable_fishs[player.id] == null) {
		  		io.emit('ca mord', player.id);
		  		console.log('player '+player.id+' catch something')
				catchable_fishs[player.id] = new Date().getTime();
	  		}
	  	}
  	}
}
setInterval(doesSomebodyGetSomething, 1000);



http.listen(3000, function(){
	console.log('listening on *:3000');
});


function findRoomClients(roomId) {
	var res = [];
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