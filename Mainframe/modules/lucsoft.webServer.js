var exportdata = module.exports = {};
exportdata.version = "0.1.0";
var msg;
var express = require('express');
var app = express();
var https = require('https');
var fs = require('fs');
var unzip = require('unzip');
var fs = require('fs');
const request = require('request');

exportdata.web = app;
exportdata.getHTTPS = (url, response) => {
    https.get(url, response);
};
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
    app.listen(exportdata.port, function () {
        exportdata.cnsl.sendMessage("Server is running on port " + exportdata.port + "...");
    });  
};