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
        $('#players').append('<div id="player_'+player_datas.id+'" class="player"><div class="canne"></div><div class="player_img"></div><div id="poissons" class="poissons_container"></div><div class="player_name">'+player_datas.name+'</div></div>');

        // bask of the player
        $('#player_'+player_datas.id+' .player_img').css('background-image', 'url("/img/'+player_datas.image.back+'")');

        // front of the player used when he catch a fish
        document.styleSheets[0].insertRule('#player_'+player_datas.id+' .player_img:after { background-image: url("/img/'+player_datas.image.front+'"); }', 5);




        if (player_datas.id === id) {
            $('#player_'+player_datas.id).addClass('my_player');
        }
        console.log('add #player_'+player_datas.id);
        $('#bouchons').append('<div id="bouchon_'+player_datas.id+'" class="bouchon"></div>');
        for (var i = 0; i < player_datas.score; i++) {
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
        console.log('page connect')
        $('#content').html(datas.view);
        // Set your name
        $('#send_pseudo').click(function() {
            socket.emit('set pseudo', $('.input_pseudo').val());
        });
    });

    // Start game
    socket.on('start game', function(datas){
        console.log('start game')
        // Your id
        id = datas.user_id;
        console.log('you are '+id);

        // View
        $('#content').html(datas.view);

        // Events
        $('#pecher').click(function() {
            console.log('pecher #bouchon_'+id)
            socket.emit('peche');
            $('#pecher').hide();
        });

        // Add all players
        $.each(datas.players, function(index, player) {
            addPlayer(player);
        });

    });

    // New player join the game
    socket.on('new user', function(player){
        console.log('new user')
        addPlayer(player);
    });

    // A player left the game
    socket.on('bye user', function(user_id){
        console.log('bye user')
        removePlayer(user_id);
    });

    // A player get something
    socket.on('got it', function(user_id){
        console.log('peche')
        $('#bouchon_'+user_id).removeClass('ca_mord');
        console.log('#player_'+user_id+' catch something');
        var poisson = $('<img>');
        poisson.addClass('catched_fish');
        poisson.attr('src', '/img/poisson.png');
        $('#bouchon_'+user_id).append(poisson);
        setTimeout(function() {
            poisson.remove();
            addFish(user_id);

            // animate player sprite
            $('#player_'+user_id).addClass('fisher_show_fish');
            setTimeout(function() {
                $('#player_'+user_id).removeClass('fisher_show_fish');
            }, 700);
        }, 700);
    });

    // A player get something
    socket.on('too late', function(user_id){
        console.log('peche')
        $('#bouchon_'+user_id).removeClass('ca_mord');
        console.log('#player_'+user_id+' got nothing');
        var poisson = $('<img>');
        poisson.addClass('too_late_fish');
        poisson.attr('src', '/img/poisson.png');
        $('#bouchon_'+user_id).append(poisson);
        setTimeout(function() {
            poisson.remove();
        }, 700);
    });

    // Invalid username
    socket.on('invalid name', function() {
        console.log('invalid name')
        $('#error').html('Votre nom n\'est pas valide.')
    });

    // a fish is ready to get catched
    socket.on('ca mord', function(user_id) {
        console.log('ca mord')
        $('#bouchon_'+user_id).addClass('ca_mord');
        if (user_id == id) {
            $('#pecher').show();
            var randomX = Math.floor((Math.random() * 100) + 1);
            var randomY = Math.floor((Math.random() * 100) + 1);
            $('#pecher').css('top', randomY+'vh');
            $('#pecher').css('left', randomX+'vw');
        }
    });


}); //end document ready