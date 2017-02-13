var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var appDir = path.dirname(require.main.filename);

// next user id
var id = 0;
var players = [];

app.locals.basedir = appDir;
app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', function(req, res){
	res.render('index', {title: 'game'});
});


io.on('connection', function(socket){

	var user_id = id++;
	console.log('a user '+user_id+' connected');
	app.render('connect', function(err, html) {
		socket.emit('page connect', {view: html});
	})

	

	socket.on('disconnect', function(){
		socket.broadcast.emit('bye user', user_id); // Tell all users that this user leave the game
		console.log('user '+user_id+' disconnected');
		// Remove this player from player list
		players.forEach(function(player, index) {
			if (player.id === user_id) {
				console.log('remove '+player.id);
				players.splice(index, 1);
			}
		});
	});

	socket.on('set pseudo', function(pseudo){
		console.log('user '+user_id+' set pseudo : '+pseudo);
		players.push({pseudo: pseudo, id: user_id, poissons: 0}); // Add this player to the list of players
		socket.broadcast.emit('new user', {pseudo: pseudo, id: user_id}); // Tell all users that a new one is connected

		var datas = {
			players: players,
			user_id: user_id
		};
		app.render('game', function(err, html) {
			datas.view = html;
			socket.emit('start game', datas);
		})
		
	});

	socket.on('peche', function(){
		console.log('user '+user_id+' action: peche');
		io.emit('peche', user_id);
		players.forEach(function(player, index) {
			if (player.id === user_id) {
				players[index].poissons++;
			}
		});
	});

});


http.listen(3000, function(){
	console.log('listening on *:3000');
});