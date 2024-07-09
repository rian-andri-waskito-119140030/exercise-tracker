const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
const uri = "mongodb+srv://rianandri1304:uchihaitachi1304@cluster0.ybkmeci.mongodb.net/?appName=Cluster0";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
});

// Define User and Exercise schemas
const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  exercises: [exerciseSchema]
});

const User = mongoose.model('User', userSchema);

// Routes

// Create a new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  const newUser = new User({ username });
  await newUser.save();
  res.json({ username: newUser.username, _id: newUser._id });
});

// Get all users
app.get('/api/users', async (req, res) => {
  const users = await User.find({}, 'username _id');
  res.json(users);
});

// Add exercise
app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const user = await User.findById(_id);

  if (!user) {
    return res.status(404).send('User not found');
  }

  const exercise = {
    description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  user.exercises.push(exercise);
  await user.save();

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
    _id: user._id
  });
});

// Get user's exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  const user = await User.findById(_id);

  if (!user) {
    return res.status(404).send('User not found');
  }

  let log = user.exercises;

  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    log = log.filter(ex => new Date(ex.date) >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    log = log.filter(ex => new Date(ex.date) <= toDate);
  }

  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  });
});

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
