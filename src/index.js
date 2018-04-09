const http = require('http');
const _ = require('lodash')

require('dotenv').config();
const Snoowrap = require('snoowrap');

/*
var admin = require("firebase-admin");
var serviceAccount = require("./fire.json")

//firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://watt-firebase.firebaseio.com/",
    databaseAuthVariableOverride: {
        uid: "watt-invite-runner"
    }    
})
*/

//server config stuff
const hostname = '127.0.0.1';
const port = 3001;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


const r = new Snoowrap({
    userAgent: 'alex-watt-runner-bot',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});


//for production use
r.config({requestDelay: 1000, continueAfterRatelimitError: true});

/*
    // begin loading modules
const Modules = require('./modules')
_.each(Modules, async (Module, name) => {
    try {
    console.log(`Trying to load ${name} module!`.bgCyan)
    const module = new Module(r)
    await module.bootstrap()
    } catch (err) {
    console.error(`${err.stack}`.bgRed)
    }
    console.log(`Done trying to load ${name} module!`.bgCyan)
}, {})
console.log('Finished loading modules!'.bgGreen.cyan)
*/

startProgram()




async function startProgram(){
    const WattInviteRunner = require('./modules/watt-invite-runner')
    const w = new WattInviteRunner(r) 
    await w.bootstrap()
}