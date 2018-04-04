const http = require('http');
require('dotenv').config();
const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');


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


lookAtAllPosts()

async function lookAtAllPosts(){
    r.getTop('changemyview', {limit: 100})
    .then(hotPosts => {
        let totalOpReplies = 0
        //console.log(results)

       const start = async () => {
            asyncForEach(hotPosts, async (post) => {
            //I only care about a post if it has more than 50 comments
            if(post.num_comments > 50){
                console.log(post.title)
                //this is where some await stuff happens?
                let comments = await post.comments.fetchAll()
                //console.log(comments)
            }    
            
            //console.log("done looking at post")
            })
            console.log("done with all")
        }

        start()

    })
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}