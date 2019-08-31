var fs = require("fs");
var config = module.exports = {};
config.config = {};
config.load = () => {
    config.config = require("./config.json"); 
};
config.get = (id) => {
    return config.config.modules[id];
};
config.infos = () => {
    return config.config.infos;
};
config.set = (id,name) => {
    config.config.modules[id][name];
};
config.push = (id,name) => {
    config.config.modules[id][name];
    fs.writeFileSync(process.cwd() + "/lib/config.json",JSON.stringify(config.config));
};
