var exportdata = module.exports = {};
exportdata.version = "0.1.0";
var msg;

var express = require('express');
var app = express();

var https = require('https');

var unzip = require('unzip');
var fs = require('fs');
const request = require('request');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

exportdata.web = app;
exportdata.getHTTPS = (url, response) => {
    https.get(url, response);
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