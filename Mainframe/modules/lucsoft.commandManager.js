var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "commandManager";
ed.icon = false;

const { exec,spawn } = require('child_process');
var config = require("../lib/config");
var tc = require("../lib/tools");

ed.control = {};
ed.control.enableLED = () => {
    ed.control.active = true;
    exec(config.command.enableLED);
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
ed.control.onWifi = (e) => {
    ed.log("Wifi found: " + e.ssid);
};
ed.control.onWifiScanned = () => {};

ed.control.scanWifi = () => {
    exec("iwlist wlan0 scan", (error,stdout,stderr) => {
        if(error) {
            ed.error("Failed to Scan wifi: " + stderr);
        } else {
            parseOutput(stdout, (error,wifis) => {
                ed.control.wifiList = wifis;
                ed.control.wifiList.forEach(element => {
                    ed.control.onWifi(element);
                });
                ed.control.onWifiScanned(wifis);
            });
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
    exec(config.command.disableLED);
    return ed.control.active;
};
ed.control.eval = (command,args,stdout,stderr,exit) => {
    var ls = spawn(command,args);
    ls.stdout.on('data', (e) => {stdout(e)});
    ls.stderr.on('data', (e) => {stderr(e)});
    ls.on('exit', (e) => {exit(e)});
};
ed.control.evalO = (msg) => {
    exec(msg);
};
ed.loadModule = () => {
};