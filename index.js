const http = require('http');
require('dotenv').config();

const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');

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




// Build Snoowrap and Snoostorm clients
const r = new Snoowrap({
    userAgent: 'alex-watt-runner-bot',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});
const client = new Snoostorm(r);


let posts = r.getTop('changemyview')
    .then(results => {
        console.log(results)
        results.forEach(post => {
            if(post.num_comments > 50){
                console.log(post.title)
                //based on this title, should be counting comments from the OP
                getCommentsFromOp(post.id)
            }
        })
    })
    .catch(() => {
        console.log("error")
    })


function getCommentsFromOp(postId){
    r.getSubmission(postId).title.then(console.log)
}