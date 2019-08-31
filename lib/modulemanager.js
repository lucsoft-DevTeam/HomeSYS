var fs = require('fs');
var tc = require("../lib/tools");
var config = require("../lib/configManager");

var mmang = module.exports = {};
mmang.onReady = (e) => {};
mmang.onModuleLoaded = (e) => {
    mmang.onReady(mmang.modules[e.id]);
};
mmang.onModuleInitializing = (e) => {
};
mmang.onModuleSendMesage = (e,msg) => {
    tc.log(`[${tc.getTimestamp(new Date())}] <${e} | \x1b[33mINFO\x1b[0m > ${msg}`);
};
mmang.logConsole = (e,msg,t) => {
    if (t == 1) {
        tc.log(`[${tc.getTimestamp(new Date())}] <${e} | \x1b[31mERROR\x1b[0m > ${msg}`);
    } else if(t == 0) {
        tc.log(`[${tc.getTimestamp(new Date())}] <${e} | \x1b[33mINFO\x1b[0m > ${msg}`);
    }
};

mmang.onModulesAllCompleted = () => {

};
function deleteModule(moduleName) {
    var solvedName = require.resolve(moduleName),
      nodeModule = require.cache[solvedName];
    if (nodeModule) {
      for (var i = 0; i < nodeModule.children.length; i++) {
        var child = nodeModule.children[i];
        deleteModule(child.filename);
      }
      delete require.cache[solvedName];
    }
  }
mmang.closeModule = (id) => {
    try {
        mmang.modules.find(x => x.name == id).data.close();
    } catch (error) {
    }
    try {
        
        mmang.modules = mmang.modules.filter(x => x.name != id);
    } catch (error) {
        console.error(error);
    }
    
    global.gc();
    tc.log(`[${tc.getTimestamp(new Date())}] <lucsoft.Mainframe> Closed ` + id );
    
};

mmang.onModulesInitialized = (_,clb) => {clb()};
mmang.modules = [];
mmang.getModule = (id) => {
    return mmang.modules.find(x => x.name == id);
} 
mmang.getModules = () => {
    var modulelist2 = [];
    for (const key in mmang.modules) {
        if (mmang.modules.hasOwnProperty(key)) {
            const element = mmang.modules[key];
            try {
                modulelist2.push({id: element.name, name: element.data.name, icon: element.data.icon, version: element.data.version})
            } catch (error) {
                mmang.logConsole(1, "lucsoft.Mainframe", "Error while checking Modules ("+mmang.modules[key].name+") " + error);
            }
        }
    }
    return modulelist2;
} 

mmang.errorswhilebooting = false;
mmang.modulewhilebooting = "";

mmang.startHomeSYS = () => {
    tc.log(`[${tc.getTimestamp(new Date())}] <lucsoft.Mainframe> Loading Modules...`);
    fs.readdir("./modules/",(e,f) => { 
        for (let index = 0; index < f.length; index++) {
            const element = f[index];
            if(element.endsWith(".js") && element != "lucsoft.Mainframe.js") {
                try {
                    var modulee = require("../modules/" + element);
                    modulee.cnsl = {sendMessage: (msg) => mmang.onModuleSendMesage(element.slice(0,element.length - 3),msg)};
                    modulee.log = (msg) => mmang.logConsole(element.slice(0,element.length - 3),msg,0);
                    modulee.error = (msg) => mmang.logConsole(element.slice(0,element.length - 3),msg,1);
                    modulee.getModule = (e) => mmang.getModule(e);
                    modulee.config = {};
                    modulee.config.get = () => config.get(element.slice(0,element.length - 3));
                    modulee.config.set = (e) => config.set(element.slice(0,element.length - 3),e);
                    modulee.config.push = (e) => config.push(element.slice(0,element.length - 3),e); 
                    modulee.config.infos = () => config.infos(); 
                    modulee.boot = {bootErrors: mmang.errorswhilebooting, moduleError: mmang.modulewhilebooting}; 
                    
                    modulee.getModules = () => mmang.getModules();
                    if(modulee.preinitModule != undefined) {modulee.preinitModule();}
                    mmang.modules.push({name: element.slice(0,element.length - 3),disabled:false,id: index, data: modulee});
                    mmang.onModuleInitializing({name: element.slice(0,element.length - 3),id: index,data: modulee});
                } catch (errorr) {
                    if (errorr == "Disabled") {
                        mmang.logConsole(element.slice(0,element.length - 3), "Module is Disabled",0);
                    } else {
                        mmang.errorswhilebooting = true;
                        mmang.logConsole(element.slice(0,element.length - 3), "Failed to Init: " + errorr,1);
                    }
                }
            } else {
                mmang.modules.push({name:"lucsoft.Mainframe", id:index,disabled: false, data: {version: config.infos().mainframe, name: "Mainframe", icon: false}});
            }
            
        }
        mmang.onModulesInitialized(mmang.modules, () => {
            var erroswhileboot;
            mmang.modules.forEach((eg) => {
                if(eg.disabled != true && eg.name != "lucsoft.Mainframe") {
                    try {
                        eg.data.loadModule();
                        mmang.onModuleLoaded({name: eg.name,id: eg.id,version: eg.data.version});
                    } catch (error) {
                        mmang.errorswhilebooting = true;
                        mmang.modulewhilebooting = {name: eg.name, id: eg.id, version: eg.data.version};
                        eg.disabled = true;
                        console.log(error);
                        mmang.onModuleSendMesage("lucsoft.Mainframe", error);
                        mmang.onModuleSendMesage("lucsoft.Mainframe", "Error while loading " + eg.name + "! disabling Module... (UPDATE THIS MODULE)");
                    }
                } 
            });
            if (mmang.errorswhilebooting) {
                mmang.onModuleSendMesage("lucsoft.Mainframe", "Some Modules created Errors but HomeSYS is running. Starting Services...");
            } else {
                mmang.onModuleSendMesage("lucsoft.Mainframe", "Starting Services...");
            }
            
            mmang.onModulesAllCompleted();
        });
    });
    
    
};