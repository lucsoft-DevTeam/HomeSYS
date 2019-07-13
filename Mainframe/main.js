try {
    require("./modules/lucsoft.Mainframe");
    
} catch (error) {
    const { exec} = require('child_process');
    exec("clear > /dev/tty1");
    exec('echo "'+ error+'" > /dev/tty1');
}