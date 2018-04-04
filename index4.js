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


/* GOOD STUFF STARTS HERE */

//snoowrap is the object that interacts with the Reddit API directly
// Build Snoowrap and Snoostorm clients
const r = new Snoowrap({
    userAgent: 'alex-watt-runner-bot',
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS
});
const client = new Snoostorm(r);


//get top 25(?) posts from change my view
r.getTop('changemyview', {limit: 100})
    .then(hotPosts => {
        let totalOpReplies = 0
        //console.log(results)

        asyncForEach(hotPosts, async (post) => {
            //I only care about a post if it has more than 50 comments
            if(post.num_comments > 50){
                totalOpReplies += getOpReplies(post)
            }    
        })
    })
    .catch((e) => {
        console.log(e)
    })

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}

async function getOpReplies(post){
    let op = post.author.name    
    let OpReplies = 0;
    let postTitle = post.title

    try{
        let comments = await post.comments.fetchAll()
        
        asyncForEach(comments, async (c) => {
            try{
                let replies = await c.replies.fetchAll()
                //console.log("done waiting for replies")            

                asyncForEach(replies, async (r) => {
                    getAllReplies(r, op, () => OpReplies++)
                })
            } catch(e){
                //console.log(e)
            }
        })
        //1 print for each post
        console.log(`TITLE: ${postTitle} OP REPLIES: ${OpReplies} `)
    }catch(e){console.log(e)}
}


//recursively get all the replies for a particular comment
function getAllReplies(reply, author, countOpCallback){
    
    //if there is a reply
    if(reply){

        //check if the reply is the OP        
        //callback to count replies fom OP
        if(reply.author.name === author){
            countOpCallback()
        }

        //callback for keeping track of the "latest" reply
        //TODO

        //fetch all the REPLIES of the individual REPLY
        reply.replies.fetchAll()
            .then(reps => {
                //recursively run this funciton for each REPLY of the REPLY
                reps.forEach(r => {
                    getAllReplies(r, author, countOpCallback)
                })
            })
            .catch(e => {
                console.log(e)
            })
    } 
}



