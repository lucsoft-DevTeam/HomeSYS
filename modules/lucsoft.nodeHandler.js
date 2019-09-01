var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "Node Handler";
ed.icon = false;
var tc = require("../lib/tools");
ed.preinitModule = () => {
    ed.events = ed.getModule("lucsoft.eventManager").data;
};
ed.loadModule = () => {
    ed.cmdmanager = ed.getModule("lucsoft.commandManager").data;
    ed.devices = ed.getModule("lucsoft.deviceManager").data;
    ed.integration = ed.getModule("lucsoft.integrationManager").data;
    
    ed.events.linkChannel("NewDevice", (user) => {
        if(!ed.checkIfSupported(user)) {    
            user.close(" because it's a Unsupported device");
        }
        ed.events.linkChannel("node-reponse", (e) => ed.log(tc.getJson(e)));
        ed.actions.sendInfo(user.name);
    });
};
ed.actions = {};
ed.actions.sendInfo = (name) => {
    ed.events.triggerChannel("node",{name:name,action:{state:"true",name:"info"}});
};
ed.actions.sendLED = (name,hue,saturation = 255,brightness = 255) => {
    ed.events.triggerChannel("node",{
        name:name,
        action: {
            state:"true",
            name:"led",
            token: ed.devices.getTokenDevice(name),
            brightness: Number.parseInt(brightness),
            hue: hue,
            saturation:Number.parseInt(saturation)
        }
    });
};

ed.checkIfSupported = (user) => {
    if (user.actions.includes("node")) {
        return true;
    }
};