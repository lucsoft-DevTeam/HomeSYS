var fs = require('fs');
var tc = require("../lib/tools");
var config = require("../lib/config");

var mmang = module.exports = {};
mmang.onReady = (e) => {};
mmang.onModuleLoaded = (e) => {
    tc.log(`[${tc.getTimestamp(new Date())}] <${e.name}> Loaded v${e.version} `);
    mmang.onReady(mmang.modules[e.id]);
};
mmang.onModuleInitializing = (e) => {
    tc.log(`[${tc.getTimestamp(new Date())}] <${e.name}> Initializing v${e.version} `);
};
mmang.onModuleSendMesage = (e,msg) => {
    tc.log(`[${tc.getTimestamp(new Date())}] <${e} | \x1b[33mINFO\x1b[0m > ${msg}`);
};
mmang.onModulesAllCompleted = () => {

};
mmang.onModulesInitialized = () => {};
mmang.modules = [];
mmang.getModule = (id) => {
    return mmang.modules.find(x => x.name == id);
} 
mmang.errorswhilebooting = false;
mmang.autoLoad = () => {
    tc.log(`[${tc.getTimestamp(new Date())}] <lucsoft.Mainframe> Loading Modules...`);
    fs.readdir("./modules/",(e,f) => { 
        for (let index = 0; index < f.length; index++) {
            const element = f[index];
            if(element.endsWith(".js") && element != "lucsoft.Mainframe.js") {
                try {
                    
                var modulee = require("../modules/" + element);
                modulee.cnsl = {sendMessage: (msg) => mmang.onModuleSendMesage(element.slice(0,element.length - 3),msg)};
                mmang.modules.push({name: element.slice(0,element.length - 3),disabled:false,id: index, data: modulee});
                mmang.onModuleInitializing({name: element.slice(0,element.length - 3),id: index,version: mmang.modules[index].data.version,data: modulee});
            
                } catch (errorr) {
                    mmang.errorswhilebooting = true;
                    mmang.onModuleSendMesage(element.slice(0,element.length - 3), "Failed to Init: " + errorr);
                    mmang.modules.push({name:element.slice(0,element.length - 3), id:index,disabled: true, data: {version: config.mainframeVersion}});
                }
            } else {
                mmang.modules.push({name:"lucsoft.Mainframe", id:index,disabled: false, data: {version: config.mainframeVersion}});
            }
            
        }
        mmang.onModulesInitialized(mmang.modules, () => {
            mmang.onModuleSendMesage("lucsoft.Mainframe", "Starting Running...");
            var erroswhileboot;
            mmang.modules.forEach((eg) => {
                if(eg.disabled != true && eg.name != "lucsoft.Mainframe") {
                    try {
                        eg.data.loadModule();
                        mmang.onModuleLoaded({name: eg.name,id: eg.id,version: eg.data.version});
                    } catch (error) {
                        mmang.errorswhilebooting = true;
                        eg.disabled = true;
                        mmang.onModuleSendMesage("lucsoft.Mainframe", "Error while loading " + eg.name + "! disabling Module... (UPDATE THIS MODULE)");
                    }
                } 
            });
            if (mmang.errorswhilebooting) {
                mmang.onModuleSendMesage("lucsoft.Mainframe", "HomeSYS is running! But some Modules created Errors");
            } else {
                mmang.onModuleSendMesage("lucsoft.Mainframe", "HomeSYS is running! Waiting for Service inputs... (No Erros while Boot)");
            }
            
            mmang.onModulesAllCompleted();
        });
    });
    
    
};