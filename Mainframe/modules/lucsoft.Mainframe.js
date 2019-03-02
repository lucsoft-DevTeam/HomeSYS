/*
    HomeSYS:Mainframe copyright by lucsoft 2019 
*/
var config = require("../lib/config");
console.log(`
 
    ▒▒     ▒▒  ▒▒▒▒▒▒▒  ▒▒     ▒▒ ▒▒▒▒▒▒▒▒  ██████  ██    ██  ██████  
    ▒▒     ▒▒ ▒▒     ▒▒ ▒▒▒   ▒▒▒ ▒▒       ██    ██  ██  ██  ██    ██ 
    ▒▒     ▒▒ ▒▒     ▒▒ ▒▒▒▒ ▒▒▒▒ ▒▒       ██         ████   ██       
    ▒▒▒▒▒▒▒▒▒ ▒▒     ▒▒ ▒▒ ▒▒▒ ▒▒ ▒▒▒▒▒▒    ██████     ██     ██████  
    ▒▒     ▒▒ ▒▒     ▒▒ ▒▒     ▒▒ ▒▒             ██    ██          ██ 
    ▒▒     ▒▒ ▒▒     ▒▒ ▒▒     ▒▒ ▒▒       ██    ██    ██    ██    ██ 
    ▒▒     ▒▒  ▒▒▒▒▒▒▒  ▒▒     ▒▒ ▒▒▒▒▒▒▒▒  ██████     ██     ██████  

    Loading Mainframe ${config.mainframeVersion}
    Written by lucsoft 2019
`);
var tc = require("../lib/tools");
var mmanager = require("../lib/modulemanager");
mmanager.autoLoad();
mmanager.onModulesInitialized = (modules, cb) => {
    modules.forEach(e => {
        if(e.name == "lucsoft.updateAssistent") {
            e.data.webs = modules.find(x => x.name == "lucsoft.webServer").data; 
            e.data.checkForUpdates(modules, () => {
                cb();
            });
               
        }
    });
};
mmanager.onReady = (e) => {
    if(e.name == "lucsoft.webServer") {
        e.data.web.get('/', function (req, res) {
            res.send('<h1>It Works!</h1>lol');
        });
        e.data.web.get('/device/lamp/true', function (req,res) {
            res.send('Changed Light');
            lamp.updatePower(true);
        })
        e.data.web.get('/device/lamp/false', function (req,res) {
            res.send('Changed Light');
            lamp.updatePower(false);
        })
        e.data.web.get('/device/lamp/toggle', function (req,res) {
            res.send('Changed Light');
            lamp.updatePower(!lamp.getPower());
        })
        

        e.data.startWebserver();
    }
}
var homekit,cmdMan,lamp;
mmanager.onModulesAllCompleted = (e) => {
    homekit = mmanager.modules.find(x => x.name == "lucsoft.HAPWrapper").data;
    cmdMan = mmanager.modules.find(x => x.name == "lucsoft.commandManager").data;
    lamp = homekit.createLamp({
        displayName:"Lamp",
        serialNumber: "L1433",
        model: "Onboard LED",
        power: true,
        onPower: (e) => {
            if(e) {
                cmdMan.control.enableLED();
            } else {
                cmdMan.control.disableLED();    
            }
        } 
    });
};

