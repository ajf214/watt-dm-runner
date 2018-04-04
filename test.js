const http = require('http');
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

const waitFor = (ms) => new Promise(r => setTimeout(r, ms))

r.getTop('changemyview', {limit: 100})
    .then(posts => {
        //do stuff with each post

        //do stuff with just one post for now
        start(posts)
    })
    .catch(e => console.log(e))


//a proper blocking version of <Array>.forEach
//this is a problem when you are running asynchronous calls inside of a forEach
//https://codeburst.io/javascript-async-await-with-foreach-b6ba62bbf404
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array)
    }
  }


  //for some reason, I have to do all the asyncForEach within this function
const start = async (posts) => {
    //for each post get all the comments
    let eligiblePosts = [];
    let invitePosts = [];

    try{
        await asyncForEach(posts, async (p) => {
            if(p.num_comments > 50){
                let OpReplies = 0;

                let object = {
                    author: p.author.name,
                    title: p.title
                }
                eligiblePosts.push(object)
            
                //get all the comments
                let comments = await p.comments.fetchAll()
                
                
                //for each comment, get all the replies
                await asyncForEach(comments, async (c) => {
                    let replies = await c.replies.fetchAll()
                
                    //for each reply, get the reply tree
                    await asyncForEach(replies, async(r) => {
                        await getAllReplies(r, object.author, () => OpReplies++)
                    })
                })

                if(OpReplies >=5){
                    let invite = {
                        author: p.author.name,
                        title: p.title,
                        authorReplies: OpReplies
                    }
                    invitePosts.push(invite)
                }
            }
        })
        console.log(invitePosts)


        //send dms to the authors
        await asyncForEach(eligiblePosts, async (e) =>{
            //send message to author
            let message = {
                to: 'sonofdiesel',
                subject: 'Contribute to ProjectWATT',
                text: `Hi ${e.author}, you are invited to contribute to 
                ProjectWATT because of your activity in your post: 
                ${e.title}`
            }
            //await r.composeMessage(message)
        })  
        //console.log("done sending messages")
    }catch(e){console.log(e)}
}


function saveInvitedPosts(){

}

async function getAllReplies(reply, author, countOpCallback){
    
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
        let childReplies = await reply.replies.fetchAll()

        //recursively, synchronously call getAllReplies
        await asyncForEach(childReplies, async(r) => {
            getAllReplies(r, author, countOpCallback)
        })    
    } 
}