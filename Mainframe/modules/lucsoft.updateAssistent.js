var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "UpdateAssistent";
ed.icon = false;

ed.loadModule = () => {
    ed.service = ed.getModule("lucsoft.homeSYSWeb").data.service;
};
ed.checkForUpdates = (modules,cb) => {
    ed.webs = modules.find(x => x.name == "lucsoft.webServer").data; 
    ed.cnsl.sendMessage("Checking for Updates...");
    try {
        ed.webs.downloadFile("https://homesys.lucsoft.de/packages.json","HomeSYSpackages.json", () => {
            ed.webs.readJson("HomeSYSpackages.json").forEach(element => {
                if(modules.find(x => x.name == element.name).data.version == element.version) {
                    ed.cnsl.sendMessage(element.name + " is up to date");
                }
            });
            cb()
        });    
    } catch (error) {
        ed.error("Check for Internet Connection"); 
    }
};
ed.installModule = (modulename,cb) => {
    ed.service.getModule(modulename,cb);
};
ed.removeModule = (modulename,cb) => {
};