$(document).ready(function(){
    var socket = io();

    var id = 'inconnu'; // Your personal id





    /**
    * ========================================================
    * Fonctions
    * ========================================================
    */
    var addPlayer = function(player_datas) {
        console.log(player_datas.id)
        console.log(id)
        $('#players').append('<div id="player_'+player_datas.id+'" class="player"><div id="poissons" class="poissons_container"></div></div>');
        $('#player_'+player_datas.id).css('background-image', 'url("/img/'+player_datas.pseudo+'.png"), url("/img/basique.png")')
        if (player_datas.id === id) {
            $('#player_'+player_datas.id).addClass('my_player');
        }
        console.log('add #player_'+player_datas.id);
        $('#bouchons').append('<div id="bouchon_'+player_datas.id+'" class="bouchon"></div>');
        for (var i = 0; i < player_datas.poissons; i++) {
            addFish(player_datas.id);
        };
    };
    var removePlayer = function(player_id) {
        $('#player_'+player_id).remove();
        $('#bouchon_'+player_id).remove();
        console.log('remove #player_'+player_id);
    };
    var addFish = function(user_id) {
        $('#player_'+user_id+' #poissons').append('<img src="/img/poisson.png" class="poisson">');
    };


    /**
    * ========================================================
    * Receive events
    * ========================================================
    */

    // Render the login view
    socket.on('page connect', function(datas){
        $('#content').html(datas.view);
        // Set your name
        $('#send_pseudo').click(function() {
            socket.emit('set pseudo', $('.input_pseudo').val());
        });
    });

    // Start game
    socket.on('start game', function(datas){
        // Your id
        id = datas.user_id;
        console.log('you are '+id);

        // View
        $('#content').html(datas.view);

        // Events
        $('#pecher').click(function() {
            socket.emit('peche');
        });

        // Add all players
        datas.players.forEach(function(player) { console.log(player)
            addPlayer(player);
        });

    });

    // New player join the game
    socket.on('new user', function(player){
        addPlayer(player);
    });

    // A player left the game
    socket.on('bye user', function(user_id){
        removePlayer(user_id);
    });

    // A player get something
    socket.on('peche', function(user_id){
        addFish(user_id);
        console.log('#player_'+user_id+' catch something');
    });


}); //end document ready