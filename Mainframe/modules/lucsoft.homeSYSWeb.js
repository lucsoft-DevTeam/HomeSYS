var ed = module.exports = {};
ed.version = "0.1.0";
var req = require('request');
var config = require("../lib/config");
ed.loadModule = () => {
    
};
ed.onOfflineMode = () => {};
ed.response = "";
ed.getReponse = () => {return ed.response};
ed.checkIfServiceIsAvailable = () => {
    var options = {
        url: 'https://homesys.lucsoft.de/v1',
        headers: {
          'token': config.web.apiKey
          }
        };
    
    req(options,(e,r,b) => {
        ed.response = JSON.parse(b);
    });
    
};