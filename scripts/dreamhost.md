# Instructions for Dreamhost node.js deployment

Dreamhost uses Passenger Fusion. [Passenger Overview](https://help.dreamhost.com/hc/en-us/articles/215769578-Passenger_overview)
. Passenger is an open source web and application server that greatly simplifies the deployment of Ruby applications, Python, and Node.js. Passenger is the preferred way to deploy and host Ruby on Rails applications across all DreamHost servers and is free on every DreamHost hosting plan. 


## 1 Install latest Node.js version

By default Passanger uses a very very version of Node.Js, so you want to update. [Update Instructions](https://help.dreamhost.com/hc/en-us/articles/360029083351-Installing-a-custom-version-of-NVM-and-Node-js)


## 2 Tell Passenger to pick latest node

Create an .htaccess file inside the application folder. Example: `/home/USER/APPNAME.DOMAIN.COM/.htaccess`
in that file add:

```sh
# This the the web server configuration file
# for Dreamhost. The line below is required to set
# the version of node js
PassengerNodejs /home/USER/.nvm/versions/node/v12.13.1/bin/node
```

### 3. Restart your app:

`touch /tmp/restart.txt`
