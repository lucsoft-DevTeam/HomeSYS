var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "webServer";
ed.icon = false;


var msg;
var express = require('express');
var app = express();
var https = require('https');
var tc = require("../lib/tools");
var config = require("../lib/config");
var path = require("path");
var fs = require('fs');
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
function requireAuth(req, res,callback) {
    if(req.headers['token'] == tc.SHA256(config.web.loginPassword)) {
        callback();
    } else {
        res.status(403).send('');
    }
}
ed.loadDefaultPages = function () {
    app.get('/', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/index.html');    
    });
    app.get('/imgs/homesys.png', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/imgs/HomeSYS2_csh_compressed.png');    
    });
    app.get('/imgs/noicon.png', function (req, res) {
        res.status(200).sendFile(process.cwd() + '/lib/web/imgs/noicon.png');    
    });
    
    app.get('/Mainframe/restart', function (req, res) {
        requireAuth(req,res,() => {
            res.status(200).send("Restarting HomeSYS now...");    
            ed.cmdmanager.control.evalO("systemctl restart homesys.service", (x,y,z) => {
                
            });
        });
    });
    app.get('/Mainframe/store/trending', function (req, res) {
        requireAuth(req,res,() => {
            https.get({
                    hostname: config.store.hostname,
                    path: config.store.trending,
                    headers: {
                        token: config.web.apiKey
                    }
                }, function (res2) {
                    var body = "";
                    res2.on('data', function (chunk) {
                        body += chunk;
                    })
                    res2.on('end', function () {
                        res.status(200).send(body);
                    })
            }).on('error',function (e) {
                ed.error(e);
            })
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
        if(req.body.password == tc.SHA256(config.web.loginPassword)) {
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

ed.loadModule = () => {
    ed.cmdmanager = ed.getModule("lucsoft.commandManager").data;
};
ed.port = 80;
ed.startWebserver = () => {
app.listen(80, function () {

})
};