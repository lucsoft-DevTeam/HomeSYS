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
            echo "Phase 1.1: NodeJS is Okay"
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
    git clone https://github.com/lucsoft-DevTeam/HomeSYS.git Mainframe
    shopt -s extglob
    rm -r !("Mainframe")
    cd Mainframe
    mv * ../
    rm -r Mainframe
    echo "Phase 3: Installing the Mainframe"
    sudo npm install > /dev/null 2>&1
    phaseThreeServiceInstall
}
phaseThreeServiceInstall() {
    echo "Phase 3: Installing the Mainframe Service"
    cd /etc/systemd/system/
    wget -q https://raw.githubusercontent.com/lucsoft-DevTeam/HomeSYS/master/Mainframe/homesys.service
    echo "Phase 4: Starting the Mainframe Service"
    systemctl enable homesys.service
    hostname homesys
    echo "Phase 5: Restarting..."
    shutdown -r now
}
phaseOneNodeJS
