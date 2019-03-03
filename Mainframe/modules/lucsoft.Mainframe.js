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
            res.sendFile(process.cwd() + '/lib/web/login.html');
            
        });
        e.data.web.get('/device/lamp/true', function (req,res) {
            res.send('Changed Light');
            lamp.updatePower(true);
        })
        e.data.web.get('/device/lamp/false', function (req,res) {
            res.send('Changed Light');
            lamp.updatePower(false);
        })
        e.data.web.get('/device/lock/lock', function (req,res) {
            res.send('Changed Lock');
            fakelock.updateState(true);
        })
        e.data.web.get('/device/lock/unlock', function (req,res) {
            res.send('Changed Lock');
            fakelock.updateState(false);
        })
        e.data.web.get('/device/sensor/detect', function (req,res) {
            res.send('Changed Sensor');
            motionsensor.updateState(true);
        })
        e.data.web.get('/device/sensor/lost', function (req,res) {
            res.send('Changed Sensor');
            motionsensor.updateState(false);
        })
        e.data.web.get('/device/sensor/toggle', function (req,res) {
            res.send('Changed Sensor');
            motionsensor.updateState(!motionsensor.getState());
        })
        e.data.web.get('/device/lamp/toggle', function (req,res) {
            res.send('Changed Light');
            lamp.updatePower(!lamp.getPower());
        })
        e.data.web.get('/errormsg', function (req,res) {
            res.send(errormsg);
        })
        e.data.startWebserver();
    }
}
var homekit,cmdMan,lamp,fakelock,motionsensor,errormsg;
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
    fakelock = homekit.createLock({
        displayName: "Lock",
        serialNumber: "FL1344",
        model: "Fake Lock",
        locked: true,
        onLockState: (e) => {
        } 
    });
    motionsensor = homekit.createMotionSensor({
        displayName: "Motion Sensor",
        serialNumber: "MS1344",
        model:"HTML Based Motion Sensor",
    });
    try {
        homekit.createCustom({
            displayName: "Motion Sensor",
            serialNumber: "GM134434",
            model:"HTML Based Motion Sensor",
        });
    } catch (error) {
        errormsg= error;
    }
};

