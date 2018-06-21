
Avalon-Server
=============

Nodejs server for Avalon eVoter.

Install on development machine
------------------------------
Run the following commands:
```
git init
git remote add origin https://github.com/YouVote/socketio-server.git
git pull
npm install
npm start
```

Config for using local socketio-server
--------------------------------------
1. clone socket-server

```
git clone https://github.com/YouVote/socketio-server.git 

cd socket-server
npm install

npm start


```
2. clone socket-router and change parameter definitions:

```
git clone https://github.com/YouVote/socketio-router.git 
socketScriptURL:"http://localhost:8080/socket.io/socket.io",

socketServerURL:"http://localhost:8080",


```
3. change socket-router definition in `clicker-dev/widget/widget-main.js` and `clicker-dev/widget/app-main.js` to 

```
"socket-router":"http://localhost/socket-router/main",



```

**make sure none of these changes are pushed up to gh-pages as it is only available locally. 