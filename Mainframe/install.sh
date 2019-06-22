#!/bin/sh
targetversion="v10.16.0"
echo "Installing lucsofts HomeSYS:Mainframe"
echo "We do all for you just wait..."
echo ""

installNodeJS() {
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash - > /dev/null 2>&1
    sudo apt-get update -qq -y > /dev/null 2>&1
    sudo apt-get install nodejs -qq -y > /dev/null 2>&1
    phaseTwoMainframe
}
phaseOneNodeJS() {
    echo "Phase 1: Checking if NodeJS is Installed"
    if which node > /dev/null 
    then
        nodeversion=`node -v`
        if [ "$nodeversion" = "$targetversion" ]; then
            echo "Phase 1: NodeJS is Okay"
            phaseTwoMainframe
        else 
            echo "Phase 1.1: Changing NodeJS's Version..."
            sudo apt-get remove nodejs -qq -y
            installNodeJS
        fi

    else
        echo "Phase 1.1: Installing NodeJS..."
        installNodeJS      
    fi
}
phaseTwoMainframe() {
    echo "Phase 2: Downloading the Mainframe"
    cd /root/
    mkdir Mainframe
    cd Mainframe
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/main.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/package.json
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/package-lock.json
    mkdir lib
    cd lib
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/lib/config.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/lib/modulemanager.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/lib/tools.js
    cd ..
    mkdir modules
    cd modules
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.Mainframe.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.HAPWrapper.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.commandManager.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.updateAssistent.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.webServer.js
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/beta/Mainframe/modules/lucsoft.deviceManager.js
    cd ..
    echo "Phase 3: Installing the Mainframe"
    sudo npm install > /dev/null 2>&1
    phaseThreeServiceInstall
}
phaseThreeServiceInstall() {
    echo "Phase 3: Installing the Mainframe Service"
    cd /etc/systemd/system/
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/testing/Mainframe/homesys.service
    echo "Phase 4: Starting the Mainframe Service"
    systemctl enable homesys.service
    hostname homesys
    echo "Phase 5: Restarting..."
    shutdown -r now
}
phaseOneNodeJS
