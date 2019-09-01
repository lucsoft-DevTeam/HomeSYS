var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "Device Manager";
ed.icon = false;
var tc = require("../lib/tools");
ed.loadModule = () => {
    ed.loadedConfig = require('../configs/lucsoft.deviceManager/config.json');
    ed.web = ed.getModule("lucsoft.webServer").data;
    ed.homekit = ed.getModule("lucsoft.HAPWrapper").data;
    
    ed.events = ed.getModule("lucsoft.eventManager").data;
    // ed.web.apiRequest("getDevices", (e) => {
        // if(e.message.message.length == 0) {
            // ed.log("You dont own registred Devices");
        // } else {
            // ed.log("Connecting to " + e.message.message.length + " Nodes");
            // e.message.message.forEach((e) => {
                // ed.web.request.get('http://' + e.serialnumber + "/info?key=" + e.key,{timeout: 300}, (err,msg) => {
                    // if(err == null) {
                        // var response = JSON.parse(msg.body);
                        // ed.addDevice({
                            // firmware:response.firmware,
                            // serialnumber: response.serialnumber,
                            // features: response.features,
                            // key: (response.features.indexOf("keyUpdate") != -1) ? e.key:false
                        // });   
                    // }
                // })
            // });
        // }
    // });
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
ed.tokenlist = [{name: "HSM-BTlhESBplyfSyyk", token:"sbHEkmOFRXxIQwDGsSJgYmCmhAYdIORY"}]
ed.getTokenDevice = (name) => {
    return ed.tokenlist.filter(x => x.name == name)[0].token;
};
ed.addDevice = (obj) => {
    if(ed.devices.filter(x => x.serialnumber == obj.serialnumber).length == 0){
        if(ed.config.get().registered[obj.serialnumber] == undefined) {
            ed.config.push().registered[obj.serialnumber] = {
                name: false, 
                mode: 0,
                changeStatusLEDbyService: false,
                homekit: true
            };
        } 
        ed.devices.push({
            type: obj.firmware.startsWith("hmsys") ? "homesysDevice":"Device",
            serialnumber: serialNumber,
            name:ed.config.set().registered[obj.serialnumber].name,
            mode:ed.config.set().registered[obj.serialnumber].mode,
            features:obj.features,
            getKey: () => {return obj.key}
        });
        ed.updateService();
        ed.events.triggerChannel("UpdatedDeviceList", ed.devices);
    }
};
ed.loadedConfig = {};
ed.services = {};
ed.services.homekit = false;
ed.updateService = () => {
    ed.devices.forEach(element => {
        if(element.homekit == true) {
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
ed.upnplist = [];
var dgram = require('dgram');
var client = dgram.createSocket('udp4');
var PORT = 1900;
ed.clientUDP =  client;

ed.scan = () => {
var HOST = '192.168.0.122';
client.on('listening', function () {
    var address = client.address();
    ed.log('UDP Client listening on ' + address.address + ":" + address.port);
    client.setMulticastTTL(128); 
    
    client.addMembership('239.255.255.250', HOST);
});

client.on('message', function (msg, remote) {   
    if(msg.indexOf("HomeSYS") != -1 && ed.upnplist.filter(x => x.ip == remote.address).length == 0){
        ed.upnplist.push({ip: remote.address, msg: msg,remote: remote});
        client.send("test",remote.port,remote.address);
    }
});

client.bind(PORT);
};
ed.enableService = (name) => {
    if(name == "HomeKit") {
        ed.services.homekit = true;
    } 
};
