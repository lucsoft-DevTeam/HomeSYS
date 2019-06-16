var config = module.exports = {};
config.mainframeVersion = "0.2.3";
config.moduleManagerVersion = "0.1.0";
config.command = {};
config.homekit = {};
config.web = {};
config.store = {};
config.store.hostname = "homesys.lucsoft.de";
config.store.trending = "/v1/store.php?type=trending";

config.discordtoken = "";
config.web.loginPassword = "Mqjz8Zy4LcY348KB";
config.web.apiKey = "";

config.homekit.username = "C1:23:4D:E3:CA:FA";
config.homekit.pincode = "131-31-313";
config.command.enableLED = "echo default-on > /sys/class/leds/green\:ph24\:led1/trigger";
config.command.disableLED = "echo none > /sys/class/leds/green\:ph24\:led1/trigger";