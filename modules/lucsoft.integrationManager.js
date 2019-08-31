var ed = module.exports = {};
ed.version = "0.1.0";
ed.name = "Integration Manager";
ed.icon = false;
var tc = require("../lib/tools");
var spotifyA = require('spotify-web-api-node');
var spotify= new spotifyA;
ed.preinitModule = () => {
    ed.events = ed.getModule("lucsoft.eventManager").data;
};
ed.service = {};
ed.service.registerSpotify = () => {

};
ed.audio = {};
ed.audio.default = "spotify";
ed.audio.pause = () => {
    switch (ed.audio.default) {
        case "spotify":
                spotify.pause();
            break;
    }
}
ed.audio.next = () => {
    switch (ed.audio.default) {
        case "spotify":
                spotify.skipToNext();
            break;
    }
}
ed.audio.previous = () => {
    switch (ed.audio.default) {
        case "spotify":
                spotify.skipToPrevious();
            break;
    }
}
ed.audio.resume = () => {
    switch (ed.audio.default) {
        case "spotify":
                spotify.play();
            break;
    }
}
ed.audio.playing = {type: "notplaying",state: {is_playing: false}};
ed.audio.updatePlaying = () => {
    spotify.getMyCurrentPlaybackState({
    })
    .then(function(data) {
        if(data.statusCode == 204) {
            var track = {type: "notplaying"};
            ed.audio.playing = track;
            ed.events.triggerChannel("PlayerChange", ed.audio.playing);
        } else {
            var track = {type: "spotify",state: data.body};
            ed.audio.playing = track;
            ed.events.triggerChannel("PlayerChange", ed.audio.playing);    
        }
    }, function(err) {
    });
};
ed.audio.play = (song) => {
    switch (ed.audio.default) {
        case "spotify":
            spotify.searchTracks(song,{limit: 1})
            .then(function(data) {
                var song = data.body.tracks.items[0];
                spotify.play({context_uri: song.album.uri,offset:{uri:song.uri}});
            }, function(err) {
                ed.error(err);
            });
        break;
    }
};

ed.loadModule = () => {
    ed.web = ed.getModule("lucsoft.webServer").data;
    
    ed.cmdmanager = ed.getModule("lucsoft.commandManager").data;
    ed.devices = ed.getModule("lucsoft.deviceManager").data;
    ed.web.apiRequest("getSpotifyToken", (e) => {
        if(e.message.token != undefined) {
            spotify.setAccessToken(e.message.token);
            ed.events.registerEvent("AudioUpdater", ed.audio.updatePlaying, ed.events.level.mid);
        } else {
            ed.error("Getting Token Failed");
        }
    });
    setInterval(() => {
        ed.web.apiRequest("getSpotifyToken", (e) => {
            if(e.message.token != undefined) {
                spotify.setAccessToken(e.message.token);
            } else {
                ed.web.apiRequest("getSpotifyToken", (e) => {
                    if(e.message.token != undefined) {
                        spotify.setAccessToken(e.message.token);
                    } else {
                        ed.web.apiRequest("getSpotifyToken", (e) => {
                            if(e.message.token != undefined) {
                                spotify.setAccessToken(e.message.token);
                            } else {
                    
                            }
                        });
                    }
                });
            }
        });
    },1000*60*30);
};