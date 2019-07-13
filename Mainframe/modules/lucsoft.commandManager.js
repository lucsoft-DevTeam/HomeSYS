var ed = module.exports = {};
ed.version = "0.2.0";
ed.name = "commandManager";
ed.icon = false;

const { exec,spawn } = require('child_process');
var tc = require("../lib/tools");

ed.control = {};
ed.control.enableLED = () => {
    ed.control.active = true;
    exec(ed.config.get().enableLED);
    return ed.control.active;
};
ed.control.active = true;

function parseOutput(str, callback) {
    var err   = null;
    var wifis = [];
    try {
        var blocks = str.split(/Cell [0-9]{2,} - Address:/);
        blocks.forEach(block => {
            var network = {};
            var lines   = block.split('\n');
            if (/([0-9a-zA-Z]{1}[0-9a-zA-Z]{1}[:]{1}){5}[0-9a-zA-Z]{1}[0-9a-zA-Z]{1}/.exec(lines[0])) {
                network.mac = lines[0].trim();

                lines.forEach(line => {
                    if (line.indexOf('ESSID:') > 0) {
                        network.ssid = line.trim().split(":")[1].slice(1).slice(0,line.trim().split(":")[1].length - 2);
                    }
                    else if (line.indexOf("Frequency") > 0) {
                        network.channel = lines[2].trim().split('Channel')[1].replace(" ", "").replace(")", "");
                        network.frequency = lines[2].trim().split(':')[1].split(" GHz")[0];
                    }
                    else if (line.indexOf('Signal level') > 0) {
                        network.rssi = parseInt(line.trim().split('  ')[1].split('=')[1]);
                        network.quality = parseInt(line.trim().split('  ')[0].split('=')[1]);
                    } else if(line.indexOf('Encryption key') > 0) {
                        network.secure = JSON.parse(lines[4].trim().split(':')[1].replace("on", true).replace("off", true));
                    }
                });
                wifis.push(network);
            }
        });
    } catch (ex) {
        err = ex;
    }

    callback(err, wifis);
}
ed.wifi = {};
ed.wifi.toggleWifi = (type) => {
    if(type) {
        exec("ifup wlan0", (error,stdout,stderr) => {
            ed.events.triggerChannel("wifiState", true);
        });
    } else {
        exec("ifdown wlan0", (error,stdout,stderr) => {
            ed.events.triggerChannel("wifiState", false);
        });
        
    }
};
ed.wifi.scan = () => {
    exec("iwlist wlan0 scan", (error,stdout,stderr) => {
        if(error) {
            if(ed.control.wifiList != []) {
                ed.control.wifiList = [];
                ed.events.triggerChannel("wifiUpdated", []);
            }
        } else {
            parseOutput(stdout, (error,wifis) => {
                if(ed.control.wifiList != wifis) {
                    ed.control.wifiList = wifis;
                    ed.events.triggerChannel("wifiUpdated", wifis);
                }
            });
        }
    });
}
ed.wifi.current = false;
ed.wifi.updateCurrent = () => {
    exec("iwgetid -r", (error,stdout,stderr) => {
        if(error) {
            if (ed.wifi.current != false) {
                ed.wifi.current = false;
                ed.events.triggerChannel("wifiConnectionUpdated", false);
            }
        } else {
            var fixed = stdout.replace(/(\r\n|\n|\r)/gm, "");
            if(ed.wifi.current != fixed) {
                ed.events.triggerChannel("wifiConnectionUpdated", fixed);
                ed.wifi.current = fixed;  
            }
        }
    });
};
ed.control.toggleLED = () => {
    if(ed.control.active){
        ed.control.disableLED();
    }
    else {
        ed.control.enableLED();
    }
    return ed.control.active;
};
ed.control.disableLED = () => {
    ed.control.active = false;
    exec(ed.config.get().disableLED); 
    return ed.control.active;
};

function evalH(command,args,stdout,stderr,exit) {
    var ls = spawn(command,args);
    ls.stdout.on('data', (e) => {stdout(e)});
    ls.stderr.on('data', (e) => {stderr(e)});
    ls.on('exit', (e) => {exit(e)});
};
ed.system = {};
ed.system.loadAverage = "";
ed.system.updateLoadAverage = () => {
    exec("cat /proc/loadavg",(error,stdout,stderr) => {
        var cmd = stdout.split(" ");
        if(ed.system.loadAverage != (cmd[0] + " " + cmd[1] + " " + cmd[2])) {
            ed.system.loadAverage = (cmd[0] + " " + cmd[1] + " " + cmd[2]);
            ed.events.triggerChannel("loadAverageUpdated", ed.system.loadAverage);
        }
    });
    
};
ed.system.restart = () => {
    exec("systemctl restart homesys.service");
}
ed.system.update = () => {
    exec("apt-get update");
    exec("apt-get upgrade -y");
    ed.log("System is up to date!");
}
ed.npm = {};
ed.npm.installAuto = (package) => {
    ed.npm.install(package, ed.log, ed.error,() => {});
};
ed.npm.removeAuto = (package) => {
    ed.npm.remove(package, ed.log, ed.error,() => {});
};
ed.npm.install = (package,out,error,exit) => {
    evalH("npm", ["install", package],out,error,exit)
};
ed.npm.remove = (package,out,error,exit) => {
    evalH("npm", ["remove", package],out,error,exit)
};

ed.loadModule = () => {
    ed.control.enableLED();
    ed.events = ed.getModule("lucsoft.eventManager").data;
    ed.events.registerEvent("wifiList", ed.wifi.scan, ed.events.level.low);
    ed.events.registerEvent("connectedWifi", ed.wifi.updateCurrent, ed.events.level.mid);
    ed.events.registerEvent("loadAverage", ed.system.updateLoadAverage, ed.events.level.mid);
    
};