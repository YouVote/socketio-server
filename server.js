var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
// 8443
var app = require('express')();
var server = app.listen(port, ipaddress, function () {
	console.log('eClicker Server listening on port '+port+'!');
});
var io = require('socket.io',{transports: ['websocket']})(server);

function gameEngine(hostSocket){
	var players={};
	var host=hostSocket;
	this.playerJoin=function(socket){
		host.emit('playerJoin',socket.id);
		players[socket.id]=socket;
	}
	this.playerQuit=function(playerSocketId){
		host.emit('playerQuit',playerSocketId);
		delete players[playerSocketId];
	}
	this.hostQuit=function(){
		for(var idx in players){
			players[idx].emit('shutdown','host closed game');
			players[idx].disconnect();
		} 
	}
	this.hostToPlayer=function(playerSocketId,msg){
		try{
			players[playerSocketId].emit('relay',msg);
		} catch(err) {
			hostSocket.emit('serverError', err);
		}
	}
	this.playerToHost=function(playerSocketId,msg){
		host.emit('relay',{'socketId':playerSocketId,'msg':msg});
	}
}


var globalEngine={
	apps:{ // appname+gameId uniquely defines game
		cl:{gameIds:{}},// eClicker
		av:{gameIds:{}} // avalon
	}, 
	newGame:function(appname,hostSocket){
		var generateId=require('./genId').genStr;
		var gameId=generateId(6);
		while(gameId in globalEngine.apps[appname].gameIds){
			gameId=generateId(6);
		}
		var gameObj=new gameEngine(hostSocket);
		globalEngine.apps[appname].gameIds[gameId]=gameObj;
		return {'gameId':gameId,'gameObj':gameObj};
	},
	getGame:function(appname,gameId){
		return globalEngine.apps[appname].gameIds[gameId];
	},
	delGame:function(appname,gameId){
		delete globalEngine.apps[appname].gameIds[gameId];
	},
	checkApp:function(appname){
		return (typeof(globalEngine.apps[appname])=='object');
	}
};

io.on('connect',function(socket){
	socket.gameData={};
	socket.emit('connectType?');
	socket.on('connectType=',function(data){
		// data contain app, type, and gameId.
		socket.gameData.appname=data.app;
		if(!globalEngine.checkApp(socket.gameData.appname)){
			socket.emit('serverShutDown','app not found '+socket.gameData.appname);
			socket.disconnect();
		}
		socket.gameData.usertype=data.type;
		switch(socket.gameData.usertype){
			case 'host':
				var gameParam=globalEngine.newGame(socket.gameData.appname,socket);
				socket.gameData.gameId=gameParam.gameId;
				socket.gameData.gameObj=gameParam.gameObj;
				socket.emit("newGameId=",socket.gameData.gameId);
				break;
			case 'play':
				socket.gameData.gameId=data.gameId;
				socket.gameData.gameObj=globalEngine.getGame(socket.gameData.appname,socket.gameData.gameId);
				if(typeof(socket.gameData.gameObj)=='object'){
					socket.gameData.gameObj.playerJoin(socket);
					socket.emit("gameStatus");
				} else {
					socket.emit('serverShutDown','game not found '+socket.gameData.gameId);
					socket.disconnect();
				}
				break;
			default:
				socket.emit('serverShutDown','usertype not recognised '+socket.gameData.usertype);
				socket.disconnect();
		}
	});
	socket.on('relay',function(data){
		switch(socket.gameData.usertype){
			case 'host':
				socket.gameData.gameObj.hostToPlayer(data.socketId,data.msg);
				break;
			case 'play':
				socket.gameData.gameObj.playerToHost(socket.id,data);
				break;
			default:
				socket.emit('serverShutDown','usertype not recognised '+socket.gameData.usertype);
				socket.disconnect();
		}

	});
	socket.on('disconnect',function(){
		switch(socket.gameData.usertype){
			case 'host':
				socket.gameData.gameObj.hostQuit();
				globalEngine.delGame(socket.gameData.appname,socket.gameData.gameId);
				break;
			case 'play':
				socket.gameData.gameObj.playerQuit(socket.id);
				break;
			default:
				socket.emit('serverShutDown','usertype not recognised '+socket.gameData.usertype);
				socket.disconnect();
		}
	});

	setTimeout(function(){
		socket.emit('ping',{beat:1});
	},25000);
})

app.get('/', function (req, res) {
	res.send('eClicker socketIO Server');
});
