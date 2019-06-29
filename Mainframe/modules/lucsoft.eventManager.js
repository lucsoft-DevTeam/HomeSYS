try {
    
var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "Event Manager";
ed.icon = false;
ed.events = {};
ed.events.low = [];
ed.events.mid = [];
ed.events.high = [];
ed.events.important = [];
ed.events.list = [];

ed.registerEvent = (name,command,level) => {
    switch (level) {
        case ed.level.important:
            ed.events.list.push({name:name,level:"important"});
            ed.events.important.push({name: name, cmd: command});
            ed.log(name + " was added to the Event Manager (level: Important)");
            return true;
        case ed.level.high:
            ed.events.list.push({name:name,level:"high"});
            ed.events.high.push({name: name, cmd: command});
            ed.log(name + " was added to the Event Manager (level: High)");
            return true;
        case ed.level.mid:
            ed.events.list.push({name:name,level:"mid"});
            ed.events.mid.push({name: name, cmd: command});
            ed.log(name + " was added to the Event Manager (level: Mid)");
            return true;
        case ed.level.low:
            ed.events.list.push({name:name,level:"low"});
            ed.events.low.push({name: name, cmd: command});
            ed.log(name + " was added to the Event Manager (level: Low)");
            return true;
        default:
            return false;
    }
};
ed.unRegisterEvent = (name) => {
    ed.events.low  = ed.events.low.filter(x => x.name != name)
    ed.events.mid  = ed.events.mid.filter(x => x.name != name)
    ed.events.high = ed.events.high.filter(x => x.name != name)
    ed.events.important = ed.events.important.filter(x => x.name != name)
    ed.events.list = ed.events.list.filter(x => x.name != name)
    return false;
};

ed.startEvents = () => {
    ed.log("Starting Events...");
    ed.events.midID = setInterval((sys) => {
        sys.events.mid.forEach(element => {
           try {
               element.cmd();
           } catch (error) {
               sys.error("Error with " + element.name + ": "+ error);
           } 
        });
    },ed.level.mid,ed);
    ed.events.lowID = setInterval((sys) => {
        sys.events.low.forEach(element => {
           try {
               element.cmd();
           } catch (error) {
               sys.error("Error with " + element.name + ": "+ error);
           } 
        });
    },ed.level.low,ed);
    ed.events.highID = setInterval((sys) => {
        sys.events.high.forEach(element => {
           try {
               element.cmd();
           } catch (error) {
               sys.error("Error with " + element.name + ": "+ error);
           } 
        });
    },ed.level.high,ed);
    ed.events.importantID = setInterval((sys) => {
        sys.events.important.forEach(element => {
           try {
               element.cmd();
           } catch (error) {
               sys.error("Error with " + element.name + ": "+ error);
           } 
        });
    },ed.level.important,ed);
    ed.log("Events are Running");
    ed.registerEvent("LedBlink", ed.cmdm.control.toggleLED, ed.level.mid);

};
ed.getEvents = () => {
    return ed.events.list;
};
ed.preinitModule = () => {
    ed.level = ed.config.get();
};
ed.loadModule = () => {
    ed.cmdm = ed.getModule("lucsoft.commandManager").data;
    
};

} catch (error) {
console.error(error);   
}