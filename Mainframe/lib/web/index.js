function Afterlogin(pass) {
    openSocket(pass);
}
loadModule("lucsoft.database", () => {database.apiurl = "/";
    elementscount++;
    $("#page").append(`<cardlist id="${elementscount}" class="iconlist"></cardlist>`);
    $(`#${elementscount}`).addClass("max-width");
    $(`#${elementscount}`).addClass("grid_columns_1");
    var elementscountid = elementscount;
    elementscount++;
    $(`#${elementscountid}`).append(`<card id="${elementscount}"class="iconbox nohover"><img src="/imgs/homesys.png"></card>`);
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
        changeSpaceing(1, 1);
        waitFor(1200, () => {
            Afterlogin(filterCookie("loginpassword"));
            $('nav').css("opacity", "100");
        });
    });
});
var menu = `[{"title":"Home","fun":"loadHome();","style":"left"},{"title":"Devices","fun":"loadDevices();"},{"title":"Modules","fun":"loadModules()"},{"title":"Settings","fun":"loadSettings()"}]`;
            
function openSocket(pass, loadhome = true) {
    ws = new WebSocket("ws://"+ window.location.hostname);
    ws.onclose = (event) => {
        triggerNotify("Connection lost");
        setTimeout(function(){openSocket(pass, false)}, 5000);
    };
    ws.onerror = (e) => {};
    ws.onopen = (e) => {
        ws.send("login " + pass);
    };
    ws.onmessage = (event) => {
        if(event.data == "trigger debug") {
            triggerNotify("This is a Debug Message");
        } else if(event.data == "LoggedIn") {
            if(loadhome) {
                loadHome();
            }
            ws.send("status");
            ws.send("regi wifiConnected");
        } else {
            var message = JSON.parse(event.data);
            if(message.type == "status"){
                Information = message.message;
                updateCard("modules", Information.modules);
                updateCard("version", Information.version);
                if(Information.wifi == false) {
                    updateCard("wifi", "Ethernet");
                    updateCard("wifi", "Connected via", true);
                } else {
                    updateCard("wifi", Information.wifi);
                    updateCard("wifi", "Connected Wifi", true);
                }
                updateCard("devices", Information.devices);
            } else if(message.type == "wifiConnected") {
                Information.wifi = message.message;
                if(Information.wifi == false) {
                    updateCard("wifi", "Ethernet");
                    updateCard("wifi", "Connected via", true);
                } else {
                    updateCard("wifi", Information.wifi);
                    updateCard("wifi", "Connected Wifi", true);
                }
            }
            console.log(message);
        }
    };
}
