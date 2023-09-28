const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

//Connect DB With the Current Project
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI);
const { Schema } = mongoose;

app.use(express.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//PRE: Create Models and Schema
const UserSchema = new Schema({
  username: String
})

const User = mongoose.model("User", UserSchema)

const ExerciseSchema = new Schema({
  user_id: { type: String, required: true },
  description: String,
  duration: Number,
  date: Date
})
const Exercise = mongoose.model("Exercise", ExerciseSchema)



//1. POST to api/users with form data username to create a new user
app.post('/api/users', async (req, res) => {
  const objUser = new User({
    username: req.body.username
  })

  try {
    const user = await objUser.save()
    res.json(user)
  } catch (err) {
    console.log(err)
    res.json({ error: json.stringify(err) })
  }

})

//2. You can make a GET request to /api/users to get a list of all users.
app.get('/api/users', async (req, res) => {
  try {
    const allUsers = await User.find({});
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//3. You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.

app.post("/api/users/:_id/exercises", (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const objExercise = new Exercise({
      description,
      user_id: req.params._id,
      duration,
      date: date ? new Date(date) : new Date(),
    });

    objExercise.save()
      .then(async exercise => {

        const user = await User.findById(req.params._id)
        if (!user) {
          res.send('Could not find the user')
        }
        res.json({
          _id: user._id,
          username: user.username,
          description: exercise.description,
          duration: exercise.duration,
          date: new Date(exercise.date).toDateString()
        })

      })
      .catch(err => {
        res.json({ error: err.message })
      })
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//4.1 You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user. - WORKING

app.get('/api/users/:_id/logs', async (req, res) => {

  try {

    const user_id = req.params._id
    const user = await User.findById(user_id)
    if (!user) {
      res.send(`Current User With ID: ${user_id} Not Found`)
    }

    /*You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. from     and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.*/

    const { from, to, limit } = req.query

    console.log('limit', limit)
    console.log('from', from)
    console.log('to', to)


    Exercise.find({ user_id: user_id }).limit(Number(limit))
      .then(exercises => {
        //4.2 A request to a user's log GET /api/users/:_id/logs returns a user object     with a count property representing the number of exercises that belong to that user. DONE

        //4.3 A GET request to /api/users/:_id/logs will return the user object with a log array of all the exercises added. DONE

        //4.4 The date property of any object in the log array that is returned from GET /api/users/:_id/logs should be a string. Use the dateString format of the Date API.

        let logs = []
        for (let exercise of exercises) {
          const datestr = new Date(exercise.date).toDateString()
          const exObj = {
            description: exercise.description,
            _id: exercise._id,
            duration: exercise.duration,
            date: datestr
          }
          logs.push(exObj)
        }

        res.json({
          _id: user_id,
          username: user.username,
          count: exercises ? exercises.length : 0,
          log: logs
        })

      })
      .catch(error => {
        res.json({ error: error.message })
      })


  } catch (error) {
    res.json({ error: error.message })
  }



})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
