console.log('socket listening on port 23784');
var io = require('socket.io').listen(23784);

var gameRoom={
	// new game method (generate gameId check nonexistant)
	// store host socket
	// playerconnect method
	// store player sockets
	// hostdisconnect method
	// playerdisconnect method
	// communication between host and players
}

io.on('connect',function(socket){
	console.log('new connection');
	socket.gamedata={};
	socket.emit('connectType?');
	socket.on('connectType',function(data){
		
		console.log('Connection Type: '+data.type);
		// switch type
		socket.gamedata.usertype=data.type;
		switch(socket.gamedata.usertype){
			case 'host':
				// get gameid and set up room
				socket.emit("newGameId=","1a2b3c");
				break;
			case 'play':
				break;
			default:
				socket.emit('serverShutDown','Unrecognized usertype '+socket.gamedata.usertype);
				socket.disconnect();
		}

	});
	socket.on('disconnect',function(){
		// gameroom disconnect
		console.log("Disconnect: "+JSON.stringify(socket.gamedata));
	});

	setTimeout(function(){
		socket.emit('ping',{beat:1});
	},25000);
})
