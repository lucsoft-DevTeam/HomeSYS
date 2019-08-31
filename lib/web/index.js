function Afterlogin(pass) {
    openSocket(pass);
}
loadModule("lucsoft.database", () => {database.apiurl = "/";
    elementscount++;
    $("#page").append(`<cardlist id="${elementscount}" style="max-width: 17rem;margin-bottom: 2rem" class="iconlist"></cardlist>`);
    $(`#${elementscount}`).addClass("max-width");
    $(`#${elementscount}`).addClass("grid_columns_1");
    var elementscountid = elementscount;
    elementscount++;
    $(`#${elementscountid}`).append(`<card id="${elementscount}"class="iconbox nohover"><img src="/imgs/loading.gif"></card>`);
    var card = elementscount;
    $(`#${card}`).addClass("blob");
    
    database.login("admin", filterCookie("loginpassword"), (e) => {
        changeSpaceing(1, 1);
        waitFor(300, () => {
            changeSpaceing(1, 2);
            addElement("loginwindow", {text: {password: "Password", button: "Login", text:"Login to HomeSYS"},
                beforelogin: () => {
                $('#loginerrormsg').css("color", "black");
                $('#loginerrormsg').css("margin", "1.6rem");
                $('#loginerrormsg').css("font-weight", "300");
                $('#loginerrormsg').html("Anmeldung Läuft...");  
                changeSpaceing(1, 2);
            },afterlogin: (e) => {
                removeLastElement();
                removeLastElement();
                hidee("#3");
                $(`#${card}`).removeClass("blob");
                changeSpaceing(1, 1);
                $(`#${card}`).addClass("blobout");
                waitFor(800,() => {
                    Afterlogin(database.account.password);
                    document.cookie = "loginpassword=" + database.account.password;
                    $('nav').css("opacity", "100");
                });
            },onError: () => {
                $('#loginerrormsg').css("color", "red");
                $('#loginerrormsg').css("margin", "1rem");
                $('#loginerrormsg').css("font-weight", "600");                    
                $('#loginerrormsg').html("Deine Anmeldedaten sind falsch");
            }}, (e)=> { 
                test=e;
            });
            newline();
            newline();
            newline();
        });
    },(e) => {        
        $("#page").append("<progressbar>");
            
        $("#page").css('--progress','0%');
        changeSpaceing(1, 1);
        waitFor(300, () => {
            $("#page").css('--progress','30%');
            Afterlogin(filterCookie("loginpassword"));
            $('nav').css("opacity", "100");
        });
    });
});
var menu = `[{"title":"Home","fun":"loadHome();","style":"left"},{"title":"Devices","fun":"loadDevices();"},{"title":"Modules","fun":"loadModules()"},{"title":"Settings","fun":"loadSettings()"}]`;
function updateTextForWifi() {
    if(Information.wifi == false && Information.ethernet == true) {
        updateCard("wifi", "Ethernet");
        updateCard("wifi", "Wifi is not Connected", true);
    } else if(Information.wifi != false && Information.ethernet == false) {
        updateCard("wifi", Information.wifi);
        updateCard("wifi", "Connected via Wifi", true);
    } else if(Information.wifi != false && Information.ethernet == true) {
        updateCard("wifi", Information.wifi);
        updateCard("wifi", "Connected via Wifi & Ethernet", true);
    }else {
        updateCard("wifi", "Not Connected");
        updateCard("wifi", "Waiting for Connection Update", true);
    }
}        
function openSocket(pass, loadhome = true) {
    ws = new WebSocket("ws://"+ window.location.hostname);
    ws.onclose = (event) => {
        triggerNotify("Connection lost");
        setTimeout(function(){openSocket(pass, false)}, 5000);
    };
    ws.onerror = (e) => {};
    ws.onopen = (e) => {
        ws.send("login " + pass);
        $("#page").css('--progress','40%');
    };
    ws.onmessage = (event) => {
        if(event.data == "trigger debug") {
            triggerNotify("This is a Debug Message");
        } else if(event.data == "LoggedIn") {
            ws.send("status");
            ws.send("regi Network Audio");
            $("#page").css('--progress','75%');
        } else {
            var message = JSON.parse(event.data);
            if(message.type == "status"){            
                Information = message.message;
                updateCard("modules", Information.modules);
                updateCard("version", Information.version);
                updateTextForWifi();
                updateCard("devices", Information.devices);
                if(loadhome) {
                    $("#page").css('--progress','100%');
                    createNav(menu, "style_nobox");
                    loadHome();
                }
            } else if(message.type == "NetworkChange") {
                Information.wifi = message.message.wifi;
                Information.ethernet = message.message.ethernet;
                
                updateTextForWifi();
            } else if(message.type == "PlayerChange") {
                if(message.message.type == "notplaying") {
                    updatePlayer(player.id,{
                        name: "No Audio",
                        artist: "",
                        album: "",
                        status: "Music Paused",
                        noImg: true,
                        isplaying: false
                    });
                    return;
                }
                Player = message.message.state;
                if(Player.is_playing == false) {
                    updatePlayer(player.id,{
                        artist: Player.item.artists[0].name,
                        album: Player.item.album.name, 
                        img: Player.item.album.images[1].url,
                        name: Player.item.name,
                        status: "Music Paused",
                        noImg: false,
                        isplaying: false
                    });
                } else {
                        
                    updatePlayer(player.id,{
                        artist: Player.item.artists[0].name,
                        album: Player.item.album.name, 
                        img: (Player.item.album.images[1] != undefined) ? Player.item.album.images[1].url : undefined,
                        name: Player.item.name,
                        status: "Playing on " + Player.device.name + ((message.message.type == "spotify") ? " with Spotify" : ""),
                        noImg: false,
                        isplaying: true
                    });
                    
                }
            } else {

                console.log(message);
            }
        }
    };
}
