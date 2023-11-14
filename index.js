const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
require('dotenv').config()
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))

const UserSchema = new Schema({
   username: String
},{strict:false});
const User = mongoose.model("user", UserSchema);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/users', async (req,res)=>{

  try{
    const users = await User.find({}).select({_id:1,username:1});
     res.json(users)
    }
  catch(err){
    console.log(err)
  }
})

app.get('/api/users/:_id/logs', async (req,res)=>{
  const {from, to, limit} = req.query;
  const _id = req.params._id;
  const $gte = new Date(from);
  const $lte = new Date(to);
  User.findById({_id:_id}).then(data =>{
    data.log.map(el =>{
       el.date = el.date.toDateString();
     })
    if(_id !== undefined&& from === undefined && to === undefined && limit === undefined){
    res.send({
     username:data.username,
     count:data.log.length,
     _id:data._id,
     log:data.log,
    })
    }else{
      User.findById({_id:_id,'log.date':{$gte:$gte,$lte:$lte}}).then(data =>{
         console.log(data)
        data.log.map(el =>{
           el.date = el.date.toDateString();
         })
         res.send({
           _id:data._id,
           username:data.username,
           from:new Date($gte).toDateString(),
           to:new Date($lte).toDateString(),
           count:data.log.length,
           log:data.log.slice(0,limit)    
         })
       })
    }
    
  })

  
   
})

app.post('/api/users', async (req,res) =>{
  console.log(req.body.username)

  const userObj = new User({
    username:req.body.username
  })
  try{
    const user = await userObj.save()
    res.json(user)
  }
  catch(err){
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req,res)=>{
  const id = req.params._id;
  const {description, duration} = req.body;
  let date = req.body.date;
  try{
   const user = await User.findById(id);
   if(!user){
     res.send("Could not find user")
   }
    else{
   console.log(req.body.date)
   const user = await User.findOneAndUpdate({_id:id},{ $push :{log:{ description : description, duration : Number(duration),date: date?date = new Date(date):date = new Date()}}},{new:true}).then(data =>{
     res.send({
      username:data.username,
      date:new Date(date).toDateString(),
      description:description,
      duration:Number(duration),
      _id:id
     })
   })

    }
  }
  catch(err){
    console.log(err)
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})