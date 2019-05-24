var ed = module.exports = {};
ed.version = "0.1.0";
var req = require('request');
var config = require("../lib/config");
ed.loadModule = () => {
    
};
ed.onOfflineMode = () => {};
ed.onOnlineMode = () => {};
ed.response = "";
ed.getReponse = () => {return ed.response};
ed.checkIfServiceIsAvailable = (callback) => {
    var options = {
        url: 'https://homesys.lucsoft.de/v1',
        headers: {
          'token': config.web.apiKey
          }
        };
    
    req(options,(e,r,b) => {
        ed.response = JSON.parse(b);
    });
    if (b.authentication == "granted") {
        ed.cnsl.sendMessage("This Home is allowed to use the HomeSYS Web Service!");
        ed.onOnlineMode();
        callback();
    } else {
        ed.cnsl.sendMessage("WARNING: This Home is not allowed to use the HomeSYS Web Service! ENABLING Offline Mode");
        ed.onOfflineMode();
        callback();
    }
};