const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {});

const userSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String,
  }]
});

// const Exercise = mongoose.model('Exercise', exerciseSchema);

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
  .post(async function(req, res){
    let user = User({
      username: req.body.username,
      count: 0
    });
    await user.save()
      .then((savedUser) => {
        res.json({
          _id: savedUser._id,
          username: savedUser.username
        });
      });
  })
  .get(async function(req, res){
    const query = User.find({});
    let users = await query.exec();
    res.json(users);
  });

app.route('/api/users/:_id/exercises')
  .post(async function(req, res){

    try{

      let date;
      console.log("ID PANO ",req.params._id)
      console.log("DATE ",req.body.date)
      if(req.body.date === undefined || req.body.date === ''){
        date = new Date();
      }
      else {
        date = new Date(req.body.date);
      }

      let log = {
        description: req.body.description,
        duration: Number(req.body.duration),
        date: date.toDateString()
      }

      const updatedResult = await User.findByIdAndUpdate(req.params._id, {
        $push: { log: log },
        $inc: { count: 1 },
      });

      
      console.log("updatedResult", updatedResult)
      res.json({
        username: updatedResult.username,
        description: req.body.description,
        duration: Number(req.body.duration),
        date: date.toDateString(),
        _id: updatedResult._id
      });

    }
    catch(err){
      console.error("ERROR ", err);
      res.json();
    }
  });


  app.route('/api/users/:_id/logs')
    .get(async function(req, res){
      try {
        console.log("USER ID ", req.params._id)
        const query = User.findById(req.params._id);
        const user = await query.exec();

        if (!user) {
          console.log('User not found');
          res.json([]);
          return;
        }

        let filteredLog = user.log;

        if(req.query.from !== undefined){
          filteredLog = user.log.filter((entry)=>{
            const logDate = new Date(entry.date);
            return (
              logDate >= new Date(req.query.from)
            )
          });
        }

        if(req.query.to !== undefined){
          filteredLog = user.log.filter((entry)=>{
            const logDate = new Date(entry.date);
            return (
              logDate <= new Date(req.query.to)
            )
          });
        }

        let limitedLogs = filteredLog;
        if(req.query.limit !== undefined){
          limitedLogs = filteredLog.splice(0, req.query.limit);
        }

        const result = { ...user.toObject(), log: limitedLogs, count: limitedLogs.length };

        res.json(result);
        return;
      }
      catch(err){
        console.error("ERROR ", err);
      }
    });




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
