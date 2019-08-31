/*
    HomeSYS:Mainframe copyright by lucsoft 2019 
*/

const { exec} = require('child_process');
exec("clear > /dev/tty1");
var fs = require("fs");
fs.writeFileSync(process.cwd() + "/lib/log.txt", "");
var config = require("../lib/configManager");
config.load();
var tc = require("../lib/tools");

tc.log(`

    ##     ##  #######  ##     ## ########  ██████  ██    ██  ██████  
    ##     ## ##     ## ###   ### ##       ██    ██  ██  ██  ██    ██ 
    ##     ## ##     ## #### #### ##       ██         ████   ██       
    ######### ##     ## ## ### ## ######    ██████     ██     ██████  
    ##     ## ##     ## ##     ## ##             ██    ██          ██ 
    ##     ## ##     ## ##     ## ##       ██    ██    ██    ██    ██ 
    ##     ##  #######  ##     ## ########  ██████     ██     ██████  

    Loading Mainframe ${config.infos().mainframe}
    Written by lucsoft 2019

    `);
try {
    var mmanager = require("../lib/modulemanager");
    mmanager.startHomeSYS();
    mmanager.onReady = (e) => {
        if(e == undefined) return;
        if(e.name == "lucsoft.webServer") {
            e.data.loadDefaultPages();    
            function requireAuth(req, res,callback) {
                if(req.headers['token'] == tc.SHA256(config.get("lucsoft.webServer").loginPassword)) {
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
        mmanager.getModule("lucsoft.eventManager").data.startEvents();
    };
} catch (error) {
    tc.log(error);
}