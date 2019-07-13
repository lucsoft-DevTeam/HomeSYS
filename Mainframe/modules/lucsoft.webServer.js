var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "webServer";
ed.icon = false;
var msg;
var express = require('express');
var app = express();
var https = require('https');
var http = require('http').createServer(app);
var tc = require("../lib/tools");
var path = require("path");
var fs = require('fs');
var WebSocketServer = require("websocket").server;
var ws;
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
ed.getWeb = () => {
    return ed.web;
};
ed.web = app;
ed.checkIfOnline = (cb) => {
    https.get("https://google.com",(res) => {cb(true);}).on("error", () => {
        cb(false);
    });
};
ed.getHTTPS = (url, response) => {
    https.get(url, response);
};
ed.requestWeb = (url, response, json = false) => {
    request(url, { json: json }, (err, res, body) => {
        if (err) { return response(err) }
        response(body);
    });
};

ed.readFile = function (path) {
    return fs.readFileSync(path);
}
ed.readJson = function (path) {
    var contents = fs.readFileSync(path);
    return JSON.parse(contents);
}
ed.fs = fs;
ed.downloadFile = function(url, path,cb) {
    var req = request({
        method: 'GET',
        uri: url
    });

    req.pipe(fs.createWriteStream(path));

    req.on('end', cb);
}
ed.updatePassword = () => {ed.SHA256Password = tc.SHA256(ed.config.get().loginPassword)};
ed.SHA256Password = "";
function requireAuth(req, res,callback) {
    if(req.headers['token'] == ed.SHA256Password) {
        callback();
    } else {
        res.status(403).send('');
    }
}
ed.trending = "";
ed.updateTrending = () => {
    https.get({
            hostname: ed.config.get().hostname,
            path: ed.config.get().trending,
            headers: {
                token: ed.config.get().token
            }
        }, function (res2) {
            var body = "";
            res2.on('data', function (chunk) {
                body += chunk;
            })
            res2.on('end', function () {
                ed.trending = body;
            })
    }).on('error',function (e) {
        ed.error(e);
    })
};
ed.loadDefaultPages = function () {
    app.get('/', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/index.html');    
    });
    app.get('/setup', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/welcome.html');    
    });
    
    app.get('/imgs/homesys.png', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/imgs/HomeSYS2_csh_compressed.png');    
    });
    app.get('/lib/socket.io.js', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/node_modules/socket.io-client/dist/socket.io.js');    
    });
    app.get('/imgs/noicon.png', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/imgs/noicon.png');    
    });
    app.get('/favicon.ico', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/imgs/icon.ico');    
    });
    app.get('/index.js', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/index.js');    
    });
    app.get('/Mainframe/restart', function (req, res) {
        requireAuth(req,res,() => {
            res.status(200).send("Restarting HomeSYS now...");    
            ed.cmdmanager.system.restart();
        });
    });
    app.get('/Mainframe/store/trending', function (req, res) {
        requireAuth(req,res,() => {
            res.status(200).send(ed.trending);
        });
    });
    app.get('/Mainframe/eval', function (req, res) {
        requireAuth(req,res,() => {
            try {
                ed.log(eval(req.query.command));
            } catch (error) {
                ed.error(error);
            }
            res.status(200).send(JSON.stringify({error:false}));
        });
    });
   
    app.post('/database.php',function (req, res) {
        if(req.body.password == tc.SHA256(ed.config.get().loginPassword)) {
            res.send(JSON.stringify({login:true, user: {theme: "white"}}));
        }else if(req.query.type != null ) {
            res.send(JSON.stringify(req.body));
        }
        else {
            res.send(JSON.stringify({error: true}));
        }
    });
    app.get('/Mainframe/log', function (req, res) {
        requireAuth(req,res,() => {
            res.set("Content-Type", "text/html; charset=utf-8");
            res.status(200).sendFile("log.txt", { root: path.join(__dirname, '../lib/') });
        });
    });
    app.get('/Mainframe/debugmsg', function (req,res) {
        requireAuth(req,res,() => {
            ed.log(`Hello World! This is a Debug Message`);
            res.status(200).send("done"); 
        });
    });
    app.get('/Mainframe/modules', function (req,res) {
        requireAuth(req,res,() => {
            res.status(200).send(tc.getJson(ed.getModules())); 
        });
    });

}
ed.deleteFiles = function(files, callback){
    var i = files.length;
    files.forEach(function(filepath){
        fs.unlink(filepath, function(err) {
        i--;
        if (err) {
            callback(err);
            return;
        } else if (i <= 0) {
            callback(null);
        }
        });
});
}
ed.preinitModule = () => {
    ed.events = ed.getModule("lucsoft.eventManager").data;
    
};
ed.loadModule = () => {
    ed.cmdmanager = ed.getModule("lucsoft.commandManager").data;
    ed.devices = ed.getModule("lucsoft.deviceManager").data;
    ed.events.linkChannel("websocket", (e) => {
        io.emit(e.id, e.message);
    });
    ed.updateTrending();
    ed.updatePassword();
};
ed.port = 80;
ed.package = [];
ed.socket = {};
ed.sockets = [];
ed.socket.actions = [{
    id: "ping",
    command: (e,socket,u,reply) => {
        reply("ping", "pong");
    } 
},{
    id: "event",
    command: (e,socket,u,reply) => {
        if(e.startsWith("event list")){
            reply("eventlist", ed.events.events.list);
        }
    }
}, {
    id: "time",
    command: (e,socket,u,reply) => {
        reply("time", tc.getTimestamp(new Date()));
    }
}, {
    id: "modules",
    command: (e,socket,u,reply) => {
        reply("modules", ed.getModules());
    }
},{
    id: "wifi",
    command: (e,socket,u,reply) => {
        if (e.replace("wifi ", "") == "on") {
            ed.cmdmanager.wifi.toggleWifi(true);
        } else if(e.replace("wifi ", "") == "off"){
            ed.cmdmanager.wifi.toggleWifi(false);
        }
    }
}, {
    id: "regi",
    command: (e,socket,u,reply) => {
        e.replace("regi ","").split(" ").forEach((e) => u.actions.push(e));
    }
},{
    id: "unregi",
    command: (e,socket,u,reply) => {
        e.replace("unregi ","").split(" ").forEach((e) => u.actions.pop(e));
    }
}, {
    id: "wifiname",
    command: (e,socket,u,reply) => {
        reply("wifiname", ed.cmdmanager.wifi.current);
    }
}, {
    id: "status",
    command: (e,socket,u,reply) => {
        reply("status", {modules:ed.getModules().length,version: ed.config.infos().mainframe,wifi: ed.cmdmanager.wifi.current,devices: ed.devices.getDevices().length,boot:ed.boot});
    }
}
]; 
ed.socket.addCommands = (name,command) => {

};
ed.socketCommuncation 
ed.startWebserver = () => {
    http.listen(80, function () {

    })
    ws = new WebSocketServer({
        httpServer: http,
        autoAcceptConnections: true,
        keepalive: true,
        fragmentOutgoingMessages: false
    });
    ws.on("connect", (socket) => {
        ed.sockets.push({socket: socket,loggedin: false});
        socket.on("message",(msgRaw) => {
            var msg = msgRaw.utf8Data;
            var user = ed.sockets.filter(x => x.socket == socket)[0];
            if(msg == undefined) return; 
            if(msg.startsWith("login")) {
                if(tc.SHA256(ed.config.get().loginPassword) == msg.slice("login ".length)) {
                    user.loggedin = true;
                    user.actions = [];
                    socket.sendUTF("LoggedIn");
                    ed.events.linkChannel("wifiConnectionUpdated",(e) => {
                        if(user.actions.indexOf("wifiConnected") != -1){
                            socket.sendUTF(tc.getJson({type:"wifiConnected", message: e}));
                        }
                    });   
                    ed.events.linkChannel("wifiUpdated",(e) => {
                        if(user.actions.indexOf("wifiList") != -1){
                            socket.sendUTF(tc.getJson({type:"wifiList", message: e}));
                        }
                    });  
                    ed.events.linkChannel("loadAverageUpdated",(e) => {
                        if(user.actions.indexOf("loadAverage") != -1){
                            socket.sendUTF(tc.getJson({type:"loadAverage", message: e}));
                        }
                    });   
                    ed.events.linkChannel("UpdatedDeviceList",(e) => {
                        if(user.actions.indexOf("deviceList") != -1){
                            socket.sendUTF(tc.getJson({type:"deviceList", message: e}));
                        }
                    });   
                    return;
                }
            }
            if(user.loggedin == false) {
                socket.sendUTF("NotLoggedIn");
            } else {
                try {
                    ed.socket.actions.filter(x => msg.startsWith(x.id))[0].command(msg,socket, user,(cmd,msg) => {socket.sendUTF(tc.getJson({type:cmd, message: msg}));});
                } catch (error) {
                    socket.sendUTF(tc.getJson({type:"error", message: "Unknown Command"}));
                }
            } 
        });
    })
};