#!/bin/bash

### NOTE: this deployment script is for DREAMHOST [insert plan name here] ####
# TODO: Link to blog article showing Dreamhost running a Node.js server

#### REQUIRED ENV VARS IN .env.server
# APP_DIR="/home/USER/APPNAME.DOMAIN.COM"
# APP_DIR_PUBLIC="/home/USER/APPNAME.DOMAIN.COM/public"
# APP_DIR_LIB="/home/USER/APPNAME.DOMAIN.COM/lib"
# USR_HST="USER@HOST.dreamhostps.com"
####

source .env.server
echo "App Base Dir: " $APP_DIR
echo "SSH user/server: " $USR_HST

if [ "$APP_DIR" == "" ]
then
    printf "\nMissing Env Vars. Exiting..."
    exit 0
fi

printf "\nCopying source files to remote application server\n"
# renamed server.js to app.js since that's what Passenger Fusion uses.
scp ../app/server.js $USR_HST:$APP_DIR/app.js
scp ../app/package.json $USR_HST:$APP_DIR
scp ../app/.env $USR_HST:$APP_DIR/.env

printf "\nInstalling packages\n"
ssh $USR_HST "cd $APP_DIR; npm install"

printf "\nCopying public files (UI)\n"
scp -r ../app/public/* $USR_HST:$APP_DIR_PUBLIC

printf "\nRestarting Server (Passanger Phusion)\n"
ssh $USR_HST "touch $APP_DIR/tmp/restart.txt"

printf "\nThe App has been updated.\n"