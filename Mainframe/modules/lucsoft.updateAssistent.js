var ed = module.exports = {};
ed.version = "0.1.0";

ed.loadModule = () => {
    
};
ed.checkForUpdates = (modules,cb) => {
    ed.webs = modules.find(x => x.name == "lucsoft.webServer").data; 
    ed.cnsl.sendMessage("Checking for Updates...");
    ed.webs.downloadFile("https://homesys.lucsoft.de/packages.json","HomeSYSpackages.json", () => {
        ed.webs.readJson("HomeSYSpackages.json").forEach(element => {
            if(modules.find(x => x.name == element.name).data.version == element.version) {
                ed.cnsl.sendMessage(element.name + " is up to date");
            }
        });
        cb()
    });
    
};
