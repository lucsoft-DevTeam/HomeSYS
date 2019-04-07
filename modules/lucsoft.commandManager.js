var ed = module.exports = {};
ed.version = "0.1.0";
const { exec } = require('child_process');
var config = require("../lib/config");
var tc = require("../lib/tools");
ed.control = {};
ed.control.enableLED = () => {
    exec(config.command.enableLED, (error, stdout, stderr) => {
      if (error) {
        tc.log(`exec error: ${error}`);
        return;
      }
    });
};
ed.control.disableLED = () => {
    exec(config.command.disableLED, (error, stdout, stderr) => {
      if (error) {
        tc.log(`exec error: ${error}`);
        return;
      }
    });
};
ed.control.eval = (msg,callback) => {
  exec(msg, callback);
};
ed.loadModule = () => {
    ed.control.disableLED();
};