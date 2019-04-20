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
        e.data.web.get('/', function (req, res) {
            res.sendFile(process.cwd() + '/lib/web/login.html');    
        });
        function requireAuth(req, res,callback) {
            if(req.headers['token'] == tc.SHA256(config.web.loginPassword)) {
                callback();
            } else {
                res.status(403);
                res.send('');
            }

        }
        e.data.web.get('/log', function (req, res) {
            requireAuth(req,res,() => {
                res.set("Content-Type", "text/html; charset=utf-8");
                res.sendFile(process.cwd() + '/lib/log.txt');
            });
        });
        e.data.web.get('/debugmsg', function (req,res) {
            requireAuth(req,res,() => {
                tc.log(`[${tc.getTimestamp(new Date())}] <lucsoft.webServer | \x1b[33mINFO\x1b[0m > Hello World! This is a Debug Message`);
                res.send("done"); 
            });
        });
        e.data.web.get('/modules', function (req,res) {
            requireAuth(req,res,() => {
                res.send(tc.getJson(mmanager.modules)); 
            });
        });
        
        e.data.web.get('/restart', function (req, res) {
            requireAuth(req,res,() => {
                res.send("Restarting HomeSYS now...");    
                cmdMan.control.eval("systemctl restart homesys.service", (x,y,z) => {
                    
                });
            });
        });
        e.data.web.post('/database.php',function (req, res) {
            if(req.body.password == tc.SHA256(config.web.loginPassword)) {
                res.send(JSON.stringify({login:true, user: {theme: "white"}}));
            }else if(req.query.type != null ) {
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
var homekit,cmdMan,lamp,lamp2,fakelock,motionsensor,errormsg,hsys;

mmanager.onModulesAllCompleted = (e) => {
    homekit = mmanager.modules.find(x => x.name == "lucsoft.HAPWrapper").data;
    cmdMan = mmanager.modules.find(x => x.name == "lucsoft.commandManager").data;
    hsys = mmanager.modules.find(x => x.name == "lucsoft.homeSYSWeb").data;
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
        msg.channel.send(eval(msg.content.replace("--eval ", "")));

    },true);
    discord.addDefaultCommands(mmanager);
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
};


} catch (error) {
    tc.log(error);
}