const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  socketId: String,
  username: String
});

const videoSchema = new mongoose.Schema({
  id: String,
  videoId: String,
  title: String,
  thumbnail: String,
  duration: String,
  addedBy: String
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  cohosts: [userSchema],
  guests: [userSchema],
  playlist: [videoSchema],
  currentVideo: videoSchema,
  videoState: {
    position: { type: Number, default: 0 },
    playing: { type: Boolean, default: false },
    timestamp: { type: Number, default: Date.now }
  },
  locked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);