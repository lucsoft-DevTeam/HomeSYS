var exportdata = module.exports = {};
exportdata.version = "0.1.0";
var msg;
var express = require('express');
var app = express();
var https = require('https');
var tc = require("../lib/tools");
var config = require("../lib/config");
var unzip = require('unzip');
var fs = require('fs');
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
exportdata.getWeb = () => {
    return exportdata.web;
};
exportdata.web = app;
exportdata.getHTTPS = (url, response) => {
    https.get(url, response);
};
exportdata.requestWeb = (url, response, json = false) => {
    request(url, { json: json }, (err, res, body) => {
        if (err) { return response(err) }
        response(body);
    });
};

exportdata.readFile = function (path) {
    return fs.readFileSync(path);
}
exportdata.readJson = function (path) {
    var contents = fs.readFileSync(path);
    return JSON.parse(contents);
}
exportdata.extractArchive = (source,target,cb) => {
    fs.createReadStream(source)
    .pipe(unzip.Extract({
        path: target 
    })).on('close', cb);
};
exportdata.fs = fs;
exportdata.downloadFile = function(url, path,cb) {
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
        res.status(403);
        res.send('');
    }
}
exportdata.loadDefaultPages = function () {
    app.get('/', function (req, res) {
        res.sendFile(process.cwd() + '/lib/web/index.html');    
    });
    app.get('/imgs/homesys.png', function (req, res) {
        res.sendFile(process.cwd() + '/lib/web/imgs/HomeSYS2_csh_compressed.png');    
    });
    app.get('/Mainframe/restart', function (req, res) {
        requireAuth(req,res,() => {
            res.send("Restarting HomeSYS now...");    
            cmdMan.control.eval("systemctl restart homesys.service", (x,y,z) => {
                
            });
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
            res.sendFile(process.cwd() + '/lib/log.txt');
        });
    });
    app.get('/Mainframe/debugmsg', function (req,res) {
        requireAuth(req,res,() => {
            tc.log(`[${tc.getTimestamp(new Date())}] <lucsoft.webServer | \x1b[33mINFO\x1b[0m > Hello World! This is a Debug Message`);
            res.send("done"); 
        });
    });
    app.get('/Mainframe/modules', function (req,res) {
        requireAuth(req,res,() => {
            res.send(tc.getJson(mmanager.modules)); 
        });
    });

}
exportdata.deleteFiles = function(files, callback){
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

exportdata.loadModule = () => {};
exportdata.port = 80;
exportdata.startWebserver = () => {
app.listen(80, function () {

})
};