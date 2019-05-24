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
    mmanager.onReady = (e) => {
        
        if(e.name == "lucsoft.webServer") {
            e.data.loadDefaultPages();    
            function requireAuth(req, res,callback) {
                if(req.headers['token'] == tc.SHA256(config.web.loginPassword)) {
                    callback();
                } else {
                    res.status(403);
                    res.send('');
                }

            }
            mmanager.getModule("lucsoft.deviceManager").data.addPages(e.data.web,requireAuth, () => {
                e.data.startWebserver();
            });
        } 
    }
    mmanager.onModulesAllCompleted = (e) => {
        homekit = mmanager.modules.find(x => x.name == "lucsoft.HAPWrapper").data;
        cmdMan = mmanager.modules.find(x => x.name == "lucsoft.commandManager").data;
        var discord = mmanager.getModule("lucsoft.DiscordClient").data;
        discord.addCommand("checkservice", (msg,c) => {
            var json = mmanager.modules.find(x => x.name == "lucsoft.homeSYSWeb").data.getReponse();
            var authorizedpersons = "";
            var rooms = "";
            json.authorizedpersons.forEach((e) => {
                authorizedpersons += e.nickname + "\n (" + e.id +")\n";
            });
            json.rooms.forEach((e) => {
                rooms += e.name + "\n(" + e.id +")\n";
            });
            
            msg.channel.send("",{embed: {
                color: 3447003,
                description: "Request from " + msg.author.username + " to DiscordClient",
                author: {
                    name: msg.author.username,
                    icon_url: msg.author.avatarURL
                },
                title: "HomeSYS: Web Service",
                fields: [
                    {
                        name: "HomeSYS Config",
                        value: `\`Name\`:  ${json.name}\n\`Authorized persons\`: ${json.authorizedpersons.length}\n\`Rooms\`: ${json.rooms.length}`,
                        inline: false
                    },  
                    {
                        name: "Authorized persons",
                        value: `${authorizedpersons}`,
                        inline: true
                    },
                    {
                        name: "Rooms",
                        value: `${rooms}`,
                        inline: true
                    }

                ]
            }});
        }, true);
        discord.addCommand("eval", (msg,c) => {
            try {
                msg.channel.send("Response "+ eval(msg.content.replace("--eval ", "")));
            } catch (error) {
                msg.channel.send("Error "+ error);
            }

        },true);
        discord.addDefaultCommands(mmanager);  
};
} catch (error) {
    tc.log(error);
}



/*
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
hsys.checkIfServiceIsAvailable(() => {
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
    }); 
*/