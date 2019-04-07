/*
    HomeSYS:Mainframe copyright by lucsoft 2019 
*/
var fs = require("fs");
fs.writeFileSync(process.cwd() + "/lib/log.txt", "");

var config = require("../lib/config");
var tc = require("../lib/tools");
tc.log(`


    ##     ##  #######  ##     ## ########  ██████  ██    ██  ██████  
    ##     ## ##     ## ###   ### ##       ██    ██  ██  ██  ██    ██ 
    ##     ## ##     ## #### #### ##       ██         ████   ██       
    ######### ##     ## ## ### ## ######    ██████     ██     ██████  
    ##     ## ##     ## ##     ## ##             ██    ██          ██ 
    ##     ## ##     ## ##     ## ##       ██    ██    ██    ██    ██ 
    ##     ##  #######  ##     ## ########  ██████     ██     ██████  

    Loading Mainframe ${config.mainframeVersion}
    Written by lucsoft 2019
`);
try {
    
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
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
mmanager.onReady = (e) => {
    
    if(e.name == "lucsoft.webServer") {
        e.data.web.get('/', function (req, res) {
            res.sendFile(process.cwd() + '/lib/web/login.html');
            
        });
        e.data.web.get('/log', function (req, res) {
            res.set("Content-Type", "text/html; charset=utf-8");
            res.sendFile(process.cwd() + '/lib/log.txt');
        });
        e.data.web.get('/debugmsg', function (req,res) {
            tc.log(`[${tc.getTimestamp(new Date())}] <lucsoft.webServer | \x1b[33mINFO\x1b[0m > Hello World! This is a Debug Message`);
           res.send("done"); 
        });
        e.data.web.get('/error', function (req,res) {
           res.send(gatedata); 
        });
        
        e.data.web.get('/data', function (req,res) {
            res.send(req);
        })
        e.data.web.get('/restart', function (req, res) {
            res.send("Restarting HomeSYS now...");
                
            cmdMan.control.eval("systemctl restart homesys.service", (x,y,z) => {
                
            });
        });
        e.data.web.post('/database.php',function (req, res) {
            if(req.body.password == tc.SHA256(config.web.loginPassword)) {
                res.send(JSON.stringify({login:true, user: {theme: "white"}}));
            } else {
                res.send(JSON.stringify({login:false}));
            }
            if(req.query.type != null ) {
                res.send(JSON.stringify(req.body));

            }
            else {
                res.send(JSON.stringify({error: true}));
            }
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
var homekit,cmdMan,lamp,lamp2,fakelock,motionsensor,errormsg;
mmanager.onModulesAllCompleted = (e) => {
    homekit = mmanager.modules.find(x => x.name == "lucsoft.HAPWrapper").data;
    cmdMan = mmanager.modules.find(x => x.name == "lucsoft.commandManager").data;
    lamp = homekit.createLamp({
        displayName:"Lamp",
        serialNumber: "L1433",
        model: "Onboard LED",
        power: false,
        onPower: (e) => {
            if(e) {
                cmdMan.control.enableLED();
            } else {
                cmdMan.control.disableLED();    
            }
        } 
    });
    lamp2 = homekit.createLamp({
        displayName:"Lamp",
        serialNumber: "L1434",
        model: "Onboard LED",
        power: true,
        onPower: (e) => {
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
    
    homekit.createSwitch({
        displayName: "Button Test",
        serialNumber: "GM134434",
        model:"Button thing",
        state: true
    });
    homekit.createOutlet({
        displayName: "Outlet Test",
        serialNumber: "Ol134434",
        model:"SUPER SMART outlet...",
        state: true
    });
    
};


} catch (error) {
    tc.log(error);
}