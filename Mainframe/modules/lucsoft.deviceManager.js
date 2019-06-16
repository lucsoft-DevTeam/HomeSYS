var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "DeviceManager";
ed.icon = false;

var req = require('request');
var config = require("../lib/config");
var tc = require("../lib/tools");
ed.loadModule = () => {
    ed.loadedConfig = require('../configs/lucsoft.deviceManager/config.json');
    ed.web = ed.getModule("lucsoft.webServer").data;
    ed.homekit = ed.getModule("lucsoft.HAPWrapper").data;
    ed.loadedConfig.devices.ips.forEach(ip => {
        ed.web.requestWeb("http://" + ip + "/info",(e) => {
            if(e.firmware != null) {
                ed.addDevice(e.serialNumber,e.firmware, ip);
            }
        }, true);    
    });
    
};
ed.updateConfig = () => {
    ed.loadedConfig = require('../configs/lucsoft.deviceManager/config.json');
};
ed.devices = [];
ed.getDevices = () => {return ed.devices;};
ed.knownTypes = [];
ed.addPages = (web,requireAuth,callback) => {
    web.get("/device/connected", function (req,res) {
        requireAuth(req,res,() => {
            res.status(200).send(tc.getJson(ed.devices));
        });
    })
    web.get("/device/online", function (req,res) {
        if(req.query.type == "HSM" ) {
            ed.cnsl.sendMessage("Autoconnect: HomeSYS-Module Connection from " + req.connection.remoteAddress.split(":ffff:")[1]); 
            var ip = req.connection.remoteAddress.split(":ffff:")[1];
            setTimeout(function() {
                ed.web.requestWeb("http://" + ip + "/info",(e) => {
                    ed.addDevice(e.serialNumber,e.firmware, ip);
                }, true);
            }, 5000);
            res.status(200).send('Connected');
        } else if(ed.knownTypes.includes(req.query.type)) {
            ed.cnsl.sendMessage("Autoconnect: " + req.query.type + " Connection from " + req.connection.remoteAddress.split(":ffff:")[1]); 
        
            res.status(200).send('Connected');
        } else {
            ed.cnsl.sendMessage("Autoconnect: Untrusted Connection from " + req.connection.remoteAddress.split(":ffff:")[1]); 
        
            res.status(403).send('Forbidden');
        }
    });
    callback();
};

ed.addDevice = (serialNumber,firmware,ip) => {
    if(ed.devices.filter(x => x.serialNumber == serialNumber).length == 0) {
        var name = (firmware.startsWith("homesyswifimodule"))? "HomeSYS Wifi Module" : "Unknown Device";
        ed.devices.push({type: "HomeSYS-Module", serialNumber: serialNumber,ip, name:name,enabledServices:[]});
        ed.cnsl.sendMessage("Added Device to HomeSYS (" + name + ")");
        ed.updateService();
    }
};
ed.loadedConfig = {};
ed.services = {};
ed.services.homekit = false;
ed.updateService = () => {
    ed.devices.forEach(element => {
        if(!element.enabledServices.includes("HomeKit")) {
            if(ed.loadedConfig.devices[element.serialNumber] != null) {
                var device = ed.loadedConfig.devices[element.serialNumber];
                if(device.useStatusLEDbyService) {
                    ed.homekit.createLamp({
                        displayName:"LED",
                        serialNumber: element.serialNumber + "-StatusLED",
                        model: "StatusLED",
                        power: false,
                        onPower: (e) => {
                            if(e) {
                                ed.web.requestWeb("http://" + element.ip + "/led?id=0&hue=0&saturation=0",(e) => {}, true);
                            } else {
                                ed.web.requestWeb("http://" + element.ip + "/led?id=0&hue=0&brightness=0",(e) => {}, true);
                            }
                        } 
                    });
                }
                if(device.sone != null) {
                    if(device.sone.D != null) {
                        if(device.sone.D.type == 1) {
                            try {
                                
                            device.sone.D.homekit = ed.homekit.createLamp({
                                displayName:device.sone.D.name,
                                serialNumber: element.serialNumber + "-PinD",
                                model: "sOne: PinD",
                                enableBrightness: device.sone.D.enableBrightness,
                                power: false,
                               
                                onPower: (e) => {
                                    if(e) {
                                        ed.web.requestWeb("http://" + element.ip + "/sone?pin=D&type=state&value=pwm&pwm=" + device.sone.D.brightness ,(e) => {}, true);
                                    } else {
                                        ed.web.requestWeb("http://" + element.ip + "/sone?pin=D&type=state&value=off&fadeStart="+device.sone.D.brightness+"&fade=" + device.sone.D.fade,(g) => {}, true);
                                        
                                    }
                                }, 
                                onBrightness: (e) => {
                                    device.sone.D.brightness = tc.scale(e,0,100,0,1024);
                                    ed.web.requestWeb("http://" + element.ip + "/sone?pin=D&type=state&value=pwm&pwm=" + device.sone.D.brightness ,(e) => {}, true);
                                }
                               
                            });

                            } catch (error) {
                                    
                            }
                        }
                    }
                }
            }
        }
    });
};
ed.enableService = (name) => {
    if(name == "HomeKit") {
        ed.services.homekit = true;
    } 
};
