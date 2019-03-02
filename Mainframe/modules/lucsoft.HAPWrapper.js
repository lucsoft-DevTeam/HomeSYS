var ed = module.exports = {};
ed.version = "0.1.0";
var fs = require('fs');
var path = require('path');
var config = require("../lib/config");
var storage = require('node-persist');
var uuid = require('hap-nodejs').uuid;
var Bridge = require('hap-nodejs').Bridge;
var Accessory = require('hap-nodejs').Accessory;
var Service = require('hap-nodejs').Service;
var Characteristic = require('hap-nodejs').Characteristic;
var bridge;
ed.Accessorylist = [];
ed.createLock = (settings) => {
    var lock = new Accessory('Lock', uuid.generate("homesys:lock:" + settings.serialNumber));
	ed.Accessorylist.push({
        locked: false,
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
            settings.onUnLock();
		    callback(); 
			lock
			.getService(Service.LockMechanism)
			.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED);
		}
		else if (value == Characteristic.LockTargetState.SECURED) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).lock();
            settings.onLock();
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
    
    ed.cnsl.sendMessage(settings.displayName + " was added to HomeKit");
    bridge.addBridgedAccessory(lock);
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
        .getService(Service.Lightbulb)
        .addCharacteristic(Characteristic.Brightness)
        .on('set', function(value, callback) {
            ed.Accessorylist.find(x => x.serialNumber == settings.serialNumber).setBrightness(value);
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