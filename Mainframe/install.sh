#!/bin/sh
targetversion="v10.15.2"
echo "Installing lucsofts HomeSYS:Mainframe"
echo "We do all for you just wait..."
echo ""

installNodeJS() {
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get update -y
    sudo apt-get install nodejs -y        
}
phaseOneNodeJS() {
    echo "Phase 1: Checking if NodeJS is Installed"
    if which node > /dev/null 
    then
        nodeversion=`node -v`
        if [ "$nodeversion" = "$targetversion" ]; then
            echo "true" 
        else 
            sudo apt-get remove nodejs
            installNodeJS
        fi

    else
        echo "Installing Node ..."
        installNodeJS      
    fi
}
phaseTwoMainframe() {
    echo "Phase 2: Downloading the Mainframe"
    cd /root/
    mkdir Mainframe
    cd Mainframe
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/main.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/package.json
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/package-lock.json
    mkdir lib
    cd lib
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/lib/config.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/lib/modulemanager.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/lib/tools.js
    cd ..
    mkdir modules
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.Mainframe.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.HAPWrapper.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.commandManager.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.updateAssistent.js
    wget https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.webServer.js
    cd ..
    echo "Phase 3: Installing the Mainframe"
    npm install
}
phaseOneNodeJS
