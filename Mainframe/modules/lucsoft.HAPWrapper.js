var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "HAPWrapper";
ed.icon = false;

var fs = require('fs');
var path = require('path');
var config = require("../lib/config");
try {
    var storage = require('node-persist');
    var uuid = require('hap-nodejs').uuid;
    var Bridge = require('hap-nodejs').Bridge;
    var Accessory = require('hap-nodejs').Accessory;
    var Service = require('hap-nodejs').Service;
    var Characteristic = require('hap-nodejs').Characteristic;    
} catch (error) {
    console.error();
    throw ("Error while loading libraries: delete node_modules and run npm install as root");
}

var bridge;
ed.Accessorylist = [];
ed.createLock = (settings) => {
    var lock = new Accessory('Lock', uuid.generate("homesys:lock:" + settings.serialNumber));
    var response= {};
	ed.Accessorylist.push({
        locked: settings.locked,
        accessory: lock,
		serialNumber: settings.serialNumber,
		lock: function() {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).locked = true;
		},
		unlock: function() { 
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).locked = false;
		},
		identify: function() {
        }
	});
	lock
	.getService(Service.AccessoryInformation)
	.setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS")
	.setCharacteristic(Characteristic.Model, settings.model)
    .setCharacteristic(Characteristic.SerialNumber, settings.serialNumber);
	lock.on('identify', function(paired, callback) {
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).identify();
		callback();
    });
    lock	
    .addService(Service.LockMechanism, settings.displayName)
	.getCharacteristic(Characteristic.LockTargetState)
	.on('set', function(value, callback) {
        if (value == Characteristic.LockTargetState.UNSECURED) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).unlock();
            settings.onLockState(false);
		    callback(); 
			lock
			.getService(Service.LockMechanism)
			.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
		}
		else if (value == Characteristic.LockTargetState.SECURED) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).lock();
            settings.onLockState(true);
			callback(); 
			lock
			.getService(Service.LockMechanism)
			.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED);
		}
    });
    lock
	.getService(Service.LockMechanism)
	.getCharacteristic(Characteristic.LockCurrentState)
	.on('get', function(callback) {
        
        var err = null;
		
		if (ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).locked) {
            callback(err, Characteristic.LockCurrentState.SECURED);
		}
		else {
            callback(err, Characteristic.LockCurrentState.UNSECURED);
		}
    });
    response.updateState = (e) => {
        if(e) {
            lock
            .getService(Service.LockMechanism)
            .setCharacteristic(Characteristic.LockTargetState, Characteristic.LockCurrentState.SECURED);
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).lock();

        } else {
            lock
            .getService(Service.LockMechanism)
            .setCharacteristic(Characteristic.LockTargetState, Characteristic.LockCurrentState.UNSECURED);
            setTimeout(() => {
                lock
                .getService(Service.LockMechanism)
                .setCharacteristic(Characteristic.LockCurrentState,  Characteristic.LockCurrentState.UNSECURED);
            }, 1000);
            
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).unlock();
        }

    }
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
    bridge.addBridgedAccessory(lock);
    if(settings.locked) {
        response.updateState(settings.locked);
    }
    return response;
}
ed.createLamp = (settings) => {
    var light = new Accessory(settings.displayName, uuid.generate('homesys:light' + settings.serialNumber));  
    var reponse = {};
    ed.Accessorylist.push({
        power: settings.power,
        accessory: light,
		serialNumber: settings.serialNumber,
        brightness: settings.defaultbrightness,
        hue: 0,
        saturation: 0,
        setPower: function(status) {this.power = status;},
        getPower: function() {return this.power;},
        setBrightness: function(brightness) { this.brightness = brightness;},
        getBrightness: function() {return this.brightness;},
        setSaturation: function(saturation) {this.saturation = saturation;},
        getSaturation: function() {return this.saturation;},
        setHue: function(hue) {this.hue = hue;},
        getHue: function() {return this.hue;},
        identify: function() {}
    });
    
    light.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS").setCharacteristic(Characteristic.Model, settings.model).setCharacteristic(Characteristic.SerialNumber, settings.serialNumber);
    light.on('identify', function(paired, callback) {
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).identify();
        callback();
    });
    light
    .addService(Service.Lightbulb, settings.displayName)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).setPower(value);
        settings.onPower(value);
      callback();
    })
    .on('get', function(callback) {
      callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).getPower());
    });
    reponse.updatePower = (e) => {
        light
        .getService(Service.Lightbulb)
        .setCharacteristic(Characteristic.On, e);
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).setPower(e);
    }
    reponse.getPower = (e) => {
        return ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).power;

    }
    
    if(settings.enableBrightness) {
        light.getService(Service.Lightbulb)
        .addCharacteristic(Characteristic.Brightness)
        .on('set', function(value, callback) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).setBrightness(value);
            settings.onBrightness(value);
          callback();
        })
        .on('get', function(callback) {
          callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).getBrightness());
        });
    }
    if(settings.enableSaturation) {
        light.getService(Service.Lightbulb)
        .getService(Service.Lightbulb)
        .addCharacteristic(Characteristic.Saturation)
        .on('set', function(value, callback) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).setSaturation(value);
          callback();
        })
        .on('get', function(callback) {
          callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).getSaturation());
        });
    }
    if(settings.enableHue) {
        light
        .getService(Service.Lightbulb)
        .addCharacteristic(Characteristic.Hue)
        .on('set', function(value, callback) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).setHue(value);
          callback();
        })
        .on('get', function(callback) {
          callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).getHue());
        });  
    }
    bridge.addBridgedAccessory(light);
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
    if(settings.power) {
        reponse.updatePower(true);
    }
    return reponse;
};
ed.createMotionSensor = (settings) => {
    var motionsensor = new Accessory(settings.displayName, uuid.generate('homesys:light' + settings.serialNumber));  
    var response = {};
    ed.Accessorylist.push({
        state: settings.state,
        accessory: motionsensor,
		serialNumber: settings.serialNumber,
    });
      
    motionsensor.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS").setCharacteristic(Characteristic.Model, settings.model).setCharacteristic(Characteristic.SerialNumber, settings.serialNumber);
    motionsensor.on('identify', function(paired, callback) {
        callback(); 
    });
    motionsensor
    .addService(Service.MotionSensor, settings.displayName)
    .getCharacteristic(Characteristic.MotionDetected)
    .on('get', function(callback) {
        callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state);
    });
    response.updateState = (e) => {
        motionsensor
        .getService(Service.MotionSensor)
        .setCharacteristic(Characteristic.MotionDetected, e);
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state = e;
    }
    response.getState = () => {
        return ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state;
    }
    if(settings.state) {
        reponse.updateState(true);
    }
    bridge.addBridgedAccessory(motionsensor);
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
    return response;

};
ed.createSwitch = (settings) => {
    var motionsensor = new Accessory(settings.displayName, uuid.generate('homesys:light' + settings.serialNumber));  
    var response = {};
    ed.Accessorylist.push({
        state: false,
        accessory: motionsensor,
		serialNumber: settings.serialNumber,
    });
      
    motionsensor.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS").setCharacteristic(Characteristic.Model, settings.model).setCharacteristic(Characteristic.SerialNumber, settings.serialNumber);
    motionsensor.on('identify', function(paired, callback) {
        callback(); 
    });
    motionsensor
    .addService(Service.Switch, settings.displayName)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state = value;
        callback(); 
        
    })
    .on('get', function(callback) {
        callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state);
    });
    response.updateState = (e) => {
        motionsensor
        .getService(Service.Switch)
        .setCharacteristic(Characteristic.On, e);
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state = e;
    }
    response.getState = () => {
        return ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state;
    }
    if(settings.state) {
        response.updateState(true);
    }
    bridge.addBridgedAccessory(motionsensor);
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
    return response;
}
ed.createOutlet = (settings) => {
    var motionsensor = new Accessory(settings.displayName, uuid.generate('homesys:light' + settings.serialNumber));  
    var response = {};
    ed.Accessorylist.push({
        state: false,
        accessory: motionsensor,
		serialNumber: settings.serialNumber,
    });
      
    motionsensor.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS").setCharacteristic(Characteristic.Model, settings.model).setCharacteristic(Characteristic.SerialNumber, settings.serialNumber);
    motionsensor.on('identify', function(paired, callback) {
        callback(); 
    });
    motionsensor
    .addService(Service.Outlet, settings.displayName)
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state = value;
        callback(); 
        
    })
    .on('get', function(callback) {
        callback(null, ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state);
    });
    response.updateState = (e) => {
        motionsensor
        .getService(Service.Outlet)
        .setCharacteristic(Characteristic.On, e);
        ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state = e;
    }
    response.getState = () => {
        return ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).state;
    }
    if(settings.state) {
        response.updateState(true);
    }
    bridge.addBridgedAccessory(motionsensor);
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
    return response;
}

ed.createTEST = (settings) => {
    var cmodule = new Accessory(settings.displayName, uuid.generate('homesys:light' + settings.serialNumber));  
    var response = {};
    ed.Accessorylist.push({
        state: false,
        accessory: cmodule,
		serialNumber: settings.serialNumber,
    });
      
    cmodule.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS").setCharacteristic(Characteristic.Model, settings.model).setCharacteristic(Characteristic.SerialNumber, settings.serialNumber);
    cmodule.on('identify', function(paired, callback) {
        callback(); 
    });

    const serviceLabel = new Service.ServiceLabel(settings.displayName)
    serviceLabel.getCharacteristic(Characteristic.ServiceLabelNamespace)
    .setValue(Characteristic.ServiceLabelNamespace.ARABIC_NUMERALS)
    cmodule.addService(serviceLabel)
    const button1Service = new Service.StatelessProgrammableSwitch('Button 1', 1)
    button1Service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({
        minValue: Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
        maxValue: Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
    })
    button1Service.getCharacteristic(Characteristic.LabelIndex)
    .setValue(1)
    cmodule.addService(button1Service)
    const button2Service = new Service.StatelessProgrammableSwitch('Button 2', 2)
    button2Service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    .setProps({
        minValue: Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
        maxValue: Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
    })
    button2Service.getCharacteristic(Characteristic.LabelIndex)
    .setValue(2)
    cmodule.addService(button2Service)

    bridge.addBridgedAccessory(cmodule);
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
};

storage.init();
var bridge = new Bridge('lucsoft HomeSYS', uuid.generate("homesys:lucsoft:test"));
ed.loadModule = () => {
    ed.cnsl.sendMessage("Preparing for KhaosT's HomeKit Accessory Server");
	
	bridge.on('identify', function(paired, callback) {
        ed.cnsl.sendMessage("Node Bridge identify");
		callback();
    });
    bridge.publish({
        username: config.homekit.username,
        port: 51826,
        pincode: config.homekit.pincode,
        category: Accessory.Categories.BRIDGE
    });
    ed.cnsl.sendMessage("HomeKit Server is running...");
    ed.cnsl.sendMessage("PINCODE: 131-31-313");
    
	bridge.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Manufacturer, "lucsofts HomeSYS")
	bridge.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.Model, "HomeSYS HomeKit")
	bridge.getService(Service.AccessoryInformation).setCharacteristic(Characteristic.SerialNumber, "framework");
};

ed.close = () => {
    bridge.unpublish();
};