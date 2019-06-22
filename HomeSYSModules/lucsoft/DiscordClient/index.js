var ed = module.exports = {};
ed.version = "0.1.1";
ed.name = "DiscordClient";
ed.icon = "https://github.com/lucsoft-DevTeam/HomeSYS/blob/master/HomeSYSModules/lucsoft/DiscordClient/logo.png?raw=true";f
var config = require("../lib/config");
var tc = require("../lib/tools");
const Discord = require('discord.js');
var client = new Discord.Client();

ed.client = client;
ed.commandList = [];
ed.prefix = "--";
ed.addCommand = (name,func, requiresadmin = false) => {
    ed.commandList.push({name: name,func:func, requiresadmin});
};
ed.close = () => {
    try {
        client.user.setStatus("offline");
        ed.client.destroy().catch((e) => {
            throw ("Destorying DiscordClient...");
        });
    } catch (error) {
        
    }
};
ed.addDefaultCommands = (mmanager,private = false) => {
    ed.addCommand("help", (msg,c) => {
        var guildlist = ""; 
        ed.commandList.forEach(e => {
            guildlist += "`--" + e.name.padEnd(15, ".") + " " + ((e.requiresadmin) ? "[Private]": "[Public]") + "`\n";
        });
        guildlist.slice(guildlist.length-2);
        msg.channel.send("",{embed: {
            color: 3447003,
            description: "Request from " + msg.author.username + " to DiscordClient",
            author: {
                name: msg.author.username,
                icon_url: msg.author.avatarURL
            },
            title: "DiscordClient: Command",
            fields: [
                {
                    name:"About DiscordClient",
                    value: "DiscordClient is a module from HomeSYS!\n Prefix: `--`\nDiscord API Wrapper: `discord.js`\nVersion: `" + ed.version + "`"
                },
                {
                    name:"Added Commands",
                    value: guildlist
                }
            ]
        }});
    },private);
    ed.addCommand("modules", (msg,c) => {
        var guildlist = ""; 
        mmanager.modules.forEach(e => {
            guildlist += "`" + e.name.padEnd(25, ".") + " v" +e.data.version + " " + ((e.disabled) ? "[DISABLED]": "[ENABLED]")+ "`\n";
        });
        guildlist.slice(guildlist.length-2);
        msg.channel.send("",{embed: {
            color: 3447003,
            description: "Request from " + msg.author.username + " to Modulemanager",
            author: {
                name: msg.author.username,
                icon_url: msg.author.avatarURL
            },
            title: "Modulemanager: Modules",
            fields: [
                {
                    name:"Loaded Modules",
                    value: guildlist
                }
            ]
        }});
    },private);
    ed.addCommand("servers", (msg,c) => {
        var guildlist = "**Serverlist**"; 
        c.guilds.array().forEach(e => {
            guildlist += "\n" + e.name;
        });
        msg.reply(guildlist);
    },private);
};
ed.onNewCommands = () => {};
ed.loadModule = () => {
    client.on("error", (e) => {});
    client.on("warn", (e) => {});
    client.on('ready', () => {
        ed.cnsl.sendMessage(`Logged in as ${client.user.tag}!`);
        client.user.setActivity('lucsoft.de', {type: 'WATCHING'});
    });
    client.on('message', msg => {
        for (let gt = 0; gt < ed.commandList.length; gt++) {
            const e = ed.commandList[gt];
            if (msg.content.startsWith(ed.prefix +e.name)) {
                if (e.requiresadmin) {
                    if (msg.author.id == "137253345336229889") {
                        try {
                            e.func(msg,client);
                        } catch (error) {
                            console.log(error);
                            ed.error(error);
                        }
                    }
                } else {
                    try {
                        e.func(msg,client);
                    } catch (error) {
                        ed.error(error);
                    }
                }
            }
        }
      });
      try {
          
          client.login(config.discordtoken).catch(() => {});
      } catch (error) {
          
      }
    ed.addDefaultCommands();
    ed.onNewCommands();
};
