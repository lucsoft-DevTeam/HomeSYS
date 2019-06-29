var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "HomeSYSWeb";
ed.icon = false;

var req = require('request');
ed.loadModule = () => {
    
};
ed.onOfflineMode = () => {};
ed.response = "";
ed.getReponse = () => {return ed.response};
ed.checkIfServiceIsAvailable = () => {
    var options = {
        url: 'https://homesys.lucsoft.de/v1',
        headers: {
          'token': ed.config.get().token
          }
        };
    
    req(options,(e,r,b) => {
        ed.response = JSON.parse(b);
    });
    
};
ed.service = {};
ed.service.getModule = (name,cb) => {
    var options = {
        url: 'https://homesys.lucsoft.de/v1/store.php?name=' + name,
        headers: {
          'token': ed.config.get().token
          }
        };
    
    req(options,(e,r,b) => {
        try {
            cb(JSON.parse(b));
        } catch (error) {
            cb(b);
        }
    });

};