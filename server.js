console.log('socket listening on port 23784');
var io = require('socket.io').listen(23784);

function game(hostSocket){
	var players={};
	var host=hostSocket;
	this.playerJoin=function(socket){
		host.emit('playerJoin',socket.id);
		players[socket.id]=socket;
		console.log(Object.keys(players));
	}
	this.playerQuit=function(playerSocketId){
		host.emit('playerQuit',playerSocketId);
		delete players[playerSocketId];
		console.log(Object.keys(players));
	}
	this.hostQuit=function(){
		for(var idx in players){
			players[idx].emit('shutdown','host closed game');
			players[idx].disconnect();
		} 
	}
	this.hostToPlayer=function(playerSocketId,msg){
		players[playerSocketId].emit('relay',msg);
	}
	this.playerToHost=function(playerSocketId,msg){
		host.emit('relay',{'socketId':playerSocketId,'msg':msg});
	}
}

var gameEngine={
	gameIds:{},
	newGame:function(hostSocket){
		var generateId=require('./genId').genStr;
		gameId=generateId(6);
		while(gameId in gameEngine.gameIds){
			gameId=generateId(6);
		}
		var gameObj=new game(hostSocket);
		gameEngine.gameIds[gameId]=gameObj;
		return {'gameId':gameId,'gameObj':gameObj};
	},
	getGame:function(gameId){
		return gameEngine.gameIds[gameId];
	},
	delGame:function(gameId){
		delete gameEngine.gameIds[gameId];
	}
};

io.on('connect',function(socket){
	console.log('new connection');
	socket.gameData={};
	socket.emit('connectType?');
	socket.on('connectType=',function(data){
		console.log('Connection Type: '+data.type);
		socket.gameData.usertype=data.type;
		switch(socket.gameData.usertype){
			case 'host':
				gameParam=gameEngine.newGame(socket);
				socket.gameData.gameId=gameParam.gameId;
				socket.gameData.gameObj=gameParam.gameObj;
				socket.emit("newGameId=",socket.gameData.gameId);
				break;
			case 'play':
				socket.gameData.gameId=data.gameId;
				socket.gameData.gameObj=gameEngine.getGame(socket.gameData.gameId);
				if(typeof(socket.gameData.gameObj)=='object'){
					socket.gameData.gameObj.playerJoin(socket);
					socket.emit("gameStatus");
				} else {
					socket.emit('serverShutDown','game not found '+socket.gameData.gameId);
					socket.disconnect();
				}
				break;
			default:
				socket.emit('serverShutDown','Unrecognized usertype '+socket.gamedata.usertype);
				socket.disconnect();
		}
	});
	socket.on('relay',function(data){
		switch(socket.gameData.usertype){
			case 'host':
				socket.gameData.gameObj.hostToPlayer(data.socketId,data.msg);
				break;
			case 'play':
				socket.gameData.gameObj.playerToHost(socket.id,data.msg);
				break;
			default:
				socket.emit('serverShutDown','Unrecognized usertype '+socket.gamedata.usertype);
				socket.disconnect();
		}

	});
	socket.on('disconnect',function(){
		switch(socket.gameData.usertype){
			case 'host':
				socket.gameData.gameObj.hostQuit();
				gameEngine.deleteGame(socket.gameData.gameId);
				break;
			case 'play':
				socket.gameData.gameObj.playerQuit(socket.id);
				break;
			default:
				socket.emit('serverShutDown','Unrecognized usertype '+socket.gamedata.usertype);
				socket.disconnect();
		}
		console.log("Disconnect: "+JSON.stringify(socket.id));
	});

	setTimeout(function(){
		socket.emit('ping',{beat:1});
	},25000);
})
