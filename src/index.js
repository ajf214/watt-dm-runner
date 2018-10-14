const http = require('http');
const _ = require('lodash')

require('dotenv').config();
const Snoowrap = require('snoowrap');

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


// for production use
r.config({requestDelay: 1000, continueAfterRatelimitError: true});
startProgram()




async function startProgram(){
    const WattInviteRunner = require('./modules/watt-invite-runner')
    const w = new WattInviteRunner(r) 
    await w.bootstrap()
}