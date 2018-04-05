const http = require('http');

require('dotenv').config();

const Snoowrap = require('snoowrap');

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


r.getNew('changemyview', {limit: 50})
    .then(posts => {
        //only work on posts older than 24 hours
        
        let oldPosts = [];
        const yesterdayInUtcSeconds = Math.floor(new Date().getTime()/1000) - (24*60*60)
        posts.forEach(p => {
            if(p.created_utc < yesterdayInUtcSeconds){
                oldPosts.push(p)
            }
        })

        start(oldPosts)
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
            //also need to check that the post is 24 hrs old
            if(p.num_comments > 50){
                console.log(`Traversing ${p.title}`)

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
                        authorReplies: OpReplies,
                        postId: p.id
                    }
                    invitePosts.push(invite)
                }
                console.log(`Done reading ${p.title} with ${OpReplies} OP replies\n\n`)
            }
        })

        saveInvitedPosts(invitePosts)
    
    }catch(e){console.log(e)}
}


async function saveInvitedPosts(invited){
    //firebase DB
    const db = admin.database()
       
    //get a db reference, which won't exist until the first push
    const currentlyInvited = await db.ref("invites").once("value")

    //for each new potential invite
    asyncForEach(invited, async i => {
        //by default assume you are NOT sending email
        try{
            if(currentlyInvited.val()){
                //compare to currently invited
                let isInvited = false;
                
                currentlyInvited.forEach(function(c){
                    
                    if(c.val().postId === i.postId){
                        //already invited
                        //BAIL
                        console.log("invite already sent") 
                        isInvited = true;
                    }
                })

                if(!isInvited){
                    const newInvite = {
                        author: i.author,
                        postId: i.postId
                    }

                    let message = {
                        to: 'sonofdiesel',
                        subject: 'Contribute to ProjectWATT',
                        text: `Hi ${i.author}, you are invited to contribute to 
                        ProjectWATT (http://projectwatt.com) because of your activity in your post: 
                        ${i.title}\n\nIf you'd like to participate, you can sign up with your invite code:
                        \n\nprojectwattpilot.  If you have any questions you can DM /u/sonofdiesel`
                    }
                    await r.composeMessage(message)

                    const key = await db.ref("invites").push(newInvite)
                }       
            }

            //this shoud only run 1 time ever?
            else{
                const newInvite = {
                    author: i.author,
                    postId: i.postId
                }
                
                try{
                    const key = await db.ref("invites").push(newInvite)
                }catch(e){console.log(e)}
            }
        }catch(e){console.log(e)}
    })    
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