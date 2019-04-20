var ed = module.exports = {};
ed.version = "0.1.0";
var req = require('request');
var config = require("../lib/config");
ed.loadModule = () => {
    ed.cnsl.sendMessage("Hello World!");
    ed.loadedConfig = require('../configs/lucsoft.deviceManager/config.json');
};
ed.loadedConfig = {};
ed.services = {};
ed.services.homekit = false;
ed.enableService = (name) => {
    if(name == "HomeKit") {
        ed.services.homekit = true;
    } 
};
