var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "webServer";
ed.icon = false;
var msg;
var crypto = require('crypto');
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
ed.apiRequest = (event,callback) => {
 
    request({
        url: "https://"+ ed.config.get().hostname + ed.config.get().api.path + "?event=" + event,
        headers: {
          'token': ed.config.get().api.token, 
          'id': ed.config.get().api.id
          }
        }, (error, res, body) => {
        if (error) {
            callback({type: "error", message:error});
            return
        }
        try {
            callback({type:"response", message:JSON.parse(body),statusCode: res.statusCode});
        } catch (error) {
            callback({type:"response", message:body,statusCode: res.statusCode});
        }
    })
};
ed.checkIfOnline = (cb) => {
    https.get("https://google.com",(res) => {cb(true);}).on("error", () => {
        cb(false);
    });
};
ed.getHTTPS = (url, response) => {
    https.get(url, response);
};
ed.request = request;
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
ed.getExpress = () => {return {app: app,res:res};};
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
    app.use("/imgs",express.static(__dirname + "/../lib/web/imgs"));
    app.get('/favicon.ico', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/imgs/favicon.ico');    
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
            res.send(JSON.stringify({login:true, user: {theme: "dark"}}));
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
    ed.integration = ed.getModule("lucsoft.integrationManager").data;
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
},{
    id: "audio",
    command: (e,socket,u,reply) => {
        if(e.startsWith("audio pause")) {
            ed.integration.audio.pause();
        } else if(e.startsWith("audio play")) {
            ed.integration.audio.play(e.replace("audio play ", ""));
        }else if(e.startsWith("audio next")) {
            ed.integration.audio.next();
        }else if(e.startsWith("audio previous")) {
            ed.integration.audio.previous();
        } else if(e.startsWith("audio resume")) {
            ed.integration.audio.resume();
        }else if(e.startsWith("audio get")) {
            reply("PlayerChange", ed.integration.audio.playing);
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
            ed.cmdmanager.network.toggleWifi(true);
        } else if(e.replace("wifi ", "") == "off" && ed.cmdmanager.network.ethernet){
            ed.cmdmanager.network.toggleWifi(false);
        } else if(e.replace("wifi ", "") == "off" && ed.cmdmanager.network.ethernet == false){
            reply("error", "NetworkRequiresEthernet");
        } 
    }
}, {
    id: "regi",
    command: (e,socket,u,reply) => {
        e.replace("regi ","").split(" ").forEach((e) => u.actions.push(e));
        if(e.includes("node")) {
            ed.events.triggerChannel("NewDevice", u);
        }
    }
},{
    id: "unregi",
    command: (e,socket,u,reply) => {
        e.replace("unregi ","").split(" ").forEach((e) => u.actions.pop(e));
    }
}, {
    id: "wifiname",
    command: (e,socket,u,reply) => {
        reply("wifiname", ed.cmdmanager.network.wifi);
    }
}, {
    id: "control",
    command: (e,socket,u,reply) => {
        var args = e.replace("control ", "").split(" ")
        if(args[0] == "hue") {
            reply("error",args);
            ed.getModule("lucsoft.nodeHandler").data.actions.sendLED(args[1], args[2],args[3],args[4]);
        }
    }
}
, {
    id: "status",
    command: (e,socket,u,reply) => {
        reply("status", {
            modules:ed.getModules().length,
            version: ed.config.infos().mainframe,
            wifi: ed.cmdmanager.network.wifi,
            ethernet: ed.cmdmanager.network.ethernet,
            devices: ed.devices.getDevices().length,
            boot:ed.boot,
            homesys: {
                id: ed.config.get().api.id
            }
        });
    }
}
]; 

ed.startWebserver = () => {
    http.listen(80, function () {

    });
    ws = new WebSocketServer({
        httpServer: http,
        autoAcceptConnections: true,
        keepalive: true,
        fragmentOutgoingMessages: false
    });
    ws.on("close", (socket) => {
        console.log(socket);
    });
    ws.on("connect", (socket) => {
        ed.sockets.push({socket: socket,loggedin: false});
        socket.on("message",(msgRaw) => {
            var msg = msgRaw.utf8Data;
            var user = ed.sockets.filter(x => x.socket.remoteAddress == socket.remoteAddress)[0];
            if(msg == undefined) return; 
            if(msg.startsWith("login")) {
                var modulelogin = msg.split(' ');
                if (modulelogin[0] == "login" && modulelogin.length == 3) {
                    if (crypto.createHash('md5').update("sbHEkmOFRXxIQwDGsSJgYmCmhAYdIORY").digest("hex") == modulelogin[2]) {
                        user.loggedin = true;
                        user.actions = [];
                        user.name = modulelogin[1];
                        user.type = "node";
                        user.close = (why = "!") => {
                            socket.close();
                            ed.sockets = ed.sockets.filter(x => x.socket.remoteAddress != socket.remoteAddress);
                            ed.log(user.name + " was forceclosed" + why);
                        };
                        ed.events.triggerChannel("node",{name:"HSM-BTlhESBplyfSyyk",action:{state:"true",name:"info"}});
                        socket.sendUTF("LoggedIn");    
                        ed.events.linkChannel("node",(e) => {
                            if(user.actions.indexOf("node") != -1 && user.name == e.name){
                                socket.sendUTF(tc.getJson({type:"node", message: e}));
                            }
                        });
                        ed.events.linkChannel("SocketError",(e) => {
                            socket.sendUTF(tc.getJson({type:"error", message: e}));
                        });   
                        ed.events.linkChannel("SocketMessage",(e) => {
                            socket.sendUTF(tc.getJson({type:"message", message: e}));
                        });   
                        return;
                    }
                } else if(tc.SHA256(ed.config.get().loginPassword) == msg.slice("login ".length)) {
                    user.loggedin = true;
                    user.actions = [];
                    user.type = "user";
                    socket.sendUTF("LoggedIn");
                    ed.events.linkChannel("NetworkChange",(e) => {
                        if(user.actions.indexOf("Network") != -1){
                            socket.sendUTF(tc.getJson({type:"NetworkChange", message: e}));
                        }
                    }); 
                    ed.events.linkChannel("PlayerChange",(e) => {
                        if(user.actions.indexOf("Audio") != -1){
                            socket.sendUTF(tc.getJson({type:"PlayerChange", message: e}));
                        }
                    }); 
                    ed.events.linkChannel("SocketError",(e) => {
                        socket.sendUTF(tc.getJson({type:"error", message: e}));
                    });   
                    ed.events.linkChannel("SocketMessage",(e) => {
                        socket.sendUTF(tc.getJson({type:"message", message: e}));
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
                    if (testJSON(msg)) {
                        ed.events.triggerChannel("node-reponse", JSON.parse(msg));
                    } else {
                        ed.socket.actions.filter(x => msg.startsWith(x.id))[0].command(msg,socket, user,(cmd,msg) => {socket.sendUTF(tc.getJson({type:cmd, message: msg}));});
                    }

                } catch (error) {
                    socket.sendUTF(tc.getJson({type:"error", message: "Unknown Command",error: error}));
                    ed.log(error);
                    console.error(error);
                }
            } 
        });
    })
};
function testJSON(text){
    if (typeof text!=="string"){
        return false;
    }
    try{
        JSON.parse(text);
        return true;
    }
    catch (error){
        return false;
    }
}