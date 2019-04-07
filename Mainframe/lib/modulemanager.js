var fs = require('fs');
var tc = require("../lib/tools");
var config = require("../lib/config");

var mmang = module.exports = {};
mmang.onReady = (e) => {};
mmang.onModuleLoaded = (e) => {
    console.log(`[${tc.getTimestamp(new Date())}] <${e.name}> Loaded v${e.version} `);
    mmang.onReady(mmang.modules[e.id]);
};
mmang.onModuleInitializing = (e) => {
    console.log(`[${tc.getTimestamp(new Date())}] <${e.name}> Initializing v${e.version} `);
};
mmang.onModuleSendMesage = (e,msg) => {
    console.log(`[${tc.getTimestamp(new Date())}] <${e} | \x1b[33mINFO\x1b[0m > ${msg}`);
};
mmang.onModulesAllCompleted = () => {

};
mmang.onModulesInitialized = () => {};
mmang.modules = [];
mmang.autoLoad = () => {
    console.log(`[${tc.getTimestamp(new Date())}] <lucsoft.Mainframe> Loading Modules...`);
    fs.readdir("./modules/",(e,f) => { 
        for (let index = 0; index < f.length; index++) {
            const element = f[index];
            if(element.endsWith(".js") && element != "lucsoft.Mainframe.js") {
                var modulee = require("../modules/" + element);
                modulee.cnsl = {sendMessage: (msg) => mmang.onModuleSendMesage(element.slice(0,element.length - 3),msg)};
                mmang.modules.push({name: element.slice(0,element.length - 3),id: index, data: modulee});
                mmang.onModuleInitializing({name: element.slice(0,element.length - 3),id: index,version: mmang.modules[index].data.version,data: modulee});
            } else {
                mmang.modules.push({name:"lucsoft.Mainframe", id:index,disabaled: true, data: {version: config.mainframeVersion}});
            }
            
        }
        mmang.onModulesInitialized(mmang.modules, () => {
            mmang.onModuleSendMesage("lucsoft.Mainframe", "Starting Running...");
            mmang.modules.forEach((eg) => {
                if(eg.disabaled != true) {
                    mmang.onModuleLoaded({name: eg.name,id: eg.id,version: eg.data.version});
                    eg.data.loadModule();
                } 
            });
            mmang.onModuleSendMesage("lucsoft.Mainframe", "Everything is running well! Waiting for Service inputs...");
            mmang.onModulesAllCompleted();
        });
    });
    
    
};