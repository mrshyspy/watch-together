const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const path = require('path');

const Room = require('./models/room');
const User = require('./models/user');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const server = http.createServer(app);
const DEFAULT_CLIENT = process.env.CLIENT_URL || "http://localhost:5173";
const io = socketIo(server, {
  cors: {
    origin: DEFAULT_CLIENT,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({ origin: DEFAULT_CLIENT }));
app.use(express.json());

// Serve static files from the React frontend build
// app.use(express.static(path.join(__dirname, '../frontend/build')));
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

console.log('--- Server Initialization ---');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY ? 'Loaded' : 'Missing');
console.log('CLIENT_URL:', process.env.CLIENT_URL);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youtube-sync', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
console.log('Registering /api/youtube routes');
app.use('/api/youtube', youtubeRoutes);

// Catch-all handler: serve index.html for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async (data) => {
    console.log(`[Socket] join-room:`, data);
    const { roomId, username, role } = data;
    
    try {
      let room = await Room.findOne({ roomId });
      
      if (!room) {
        // Create new room if it doesn't exist
        room = new Room({
          roomId,
          cohosts: role === 'cohost' ? [{ socketId: socket.id, username }] : [],
          guests: role === 'guest' ? [{ socketId: socket.id, username }] : [],
          playlist: [],
          currentVideo: null,
          videoState: { position: 0, playing: false, timestamp: Date.now() }
        });
        await room.save();
      } else {
        // Check if room is locked and user is guest
        if (room.locked && role === 'guest') {
          socket.emit('room-locked', { roomId });
          return;
        }

        // Check cohost limit
       if (role === 'cohost' && room.cohosts.length >= 2) {
  socket.emit('cohost-limit-reached', {
    roomId,
    message: 'Cohost limit reached. Please join as a guest.'
  });
  return;
}

        // Add user to room
        if (role === 'cohost') {
          room.cohosts.push({ socketId: socket.id, username });
        } else {
          room.guests.push({ socketId: socket.id, username });
        }
        await room.save();
      }

      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      socket.role = role;

      // Send room data to new user
      socket.emit('room-joined', {
        room: room,
        userRole: role
      });

      // Notify other users
      socket.to(roomId).emit('user-joined', {
        username,
        role,
        users: [...room.cohosts, ...room.guests]
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Video control events (only cohosts can control)
  socket.on('video-play', async (data) => {
    console.log(`[Socket] video-play:`, data);
    if (socket.role !== 'cohost') return;
    
    const { position, timestamp } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    room.videoState = { position, playing: true, timestamp };
    await room.save();
    
    socket.to(socket.roomId).emit('video-play', { position, timestamp });
  });

  socket.on('video-pause', async (data) => {
    console.log(`[Socket] video-pause:`, data);
    if (socket.role !== 'cohost') return;
    
    const { position, timestamp } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    room.videoState = { position, playing: false, timestamp };
    await room.save();
    
    socket.to(socket.roomId).emit('video-pause', { position, timestamp });
  });

  socket.on('video-seek', async (data) => {
    console.log(`[Socket] video-seek:`, data);
    if (socket.role !== 'cohost') return;
    
    const { position, timestamp } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    room.videoState = { ...room.videoState, position, timestamp };
    await room.save();
    
    socket.to(socket.roomId).emit('video-seek', { position, timestamp });
  });

  // Playlist management
  socket.on('add-video', async (data) => {
    console.log(`[Socket] add-video:`, data);
    const { videoId, title, thumbnail, duration } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    const video = { id: uuidv4(), videoId, title, thumbnail, duration, addedBy: socket.username };
    room.playlist.push(video);
    
    if (!room.currentVideo) {
      room.currentVideo = video;
    }
    
    await room.save();
    
    io.to(socket.roomId).emit('playlist-updated', {
      playlist: room.playlist,
      currentVideo: room.currentVideo
    });
  });

  socket.on('remove-video', async (data) => {
    console.log(`[Socket] remove-video:`, data);
    if (socket.role !== 'cohost') return;
    
    const { videoId } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    room.playlist = room.playlist.filter(v => v.id !== videoId);
    await room.save();
    
    io.to(socket.roomId).emit('playlist-updated', {
      playlist: room.playlist,
      currentVideo: room.currentVideo
    });
  });

  socket.on('next-video', async () => {
    console.log(`[Socket] next-video`);
    if (socket.role !== 'cohost') return;
    
    const room = await Room.findOne({ roomId: socket.roomId });
    const currentIndex = room.playlist.findIndex(v => v.id === room.currentVideo?.id);
    
    if (currentIndex < room.playlist.length - 1) {
      room.currentVideo = room.playlist[currentIndex + 1];
      room.videoState = { position: 0, playing: false, timestamp: Date.now() };
      await room.save();
      
      io.to(socket.roomId).emit('video-changed', {
        currentVideo: room.currentVideo,
        videoState: room.videoState
      });
    }
  });

  // User management
  socket.on('promote-user', async (data) => {
    console.log(`[Socket] promote-user:`, data);
    if (socket.role !== 'cohost') return;
    
    const { username } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    // Find user in guests and move to cohosts
    const guestIndex = room.guests.findIndex(g => g.username === username);
    if (guestIndex !== -1 && room.cohosts.length < 2) {
      const guest = room.guests.splice(guestIndex, 1)[0];
      room.cohosts.push(guest);
      await room.save();
      
      // Update user's role in socket
      const targetSocket = [...io.sockets.sockets.values()]
        .find(s => s.username === username && s.roomId === socket.roomId);
      if (targetSocket) {
        targetSocket.role = 'cohost';
        targetSocket.emit('role-updated', { role: 'cohost' });
      }
      
      io.to(socket.roomId).emit('users-updated', {
        cohosts: room.cohosts,
        guests: room.guests
      });
    }
  });

  socket.on('demote-user', async (data) => {
    console.log(`[Socket] demote-user:`, data);
    if (socket.role !== 'cohost') return;
    
    const { username } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    
    // Find user in cohosts and move to guests
    const cohostIndex = room.cohosts.findIndex(c => c.username === username);
    if (cohostIndex !== -1) {
      const cohost = room.cohosts.splice(cohostIndex, 1)[0];
      room.guests.push(cohost);
      await room.save();
      
      // Update user's role in socket
      const targetSocket = [...io.sockets.sockets.values()]
        .find(s => s.username === username && s.roomId === socket.roomId);
      if (targetSocket) {
        targetSocket.role = 'guest';
        targetSocket.emit('role-updated', { role: 'guest' });
      }
      
      io.to(socket.roomId).emit('users-updated', {
        cohosts: room.cohosts,
        guests: room.guests
      });
    }
  });

  socket.on('toggle-room-lock', async () => {
    console.log(`[Socket] toggle-room-lock`);
    if (socket.role !== 'cohost') return;
    
    const room = await Room.findOne({ roomId: socket.roomId });
    room.locked = !room.locked;
    await room.save();
    
    io.to(socket.roomId).emit('room-lock-updated', { locked: room.locked });
  });

  // Chat functionality
  socket.on('chat-message', async (data) => {
    console.log(`[Socket] chat-message:`, data);
    const { message } = data;
    
    const chatMessage = {
      id: uuidv4(),
      username: socket.username,
      message,
      timestamp: new Date(),
      role: socket.role
    };
    
    io.to(socket.roomId).emit('chat-message', chatMessage);
  });

  socket.on('user-reaction', (data) => {
    console.log(`[Socket] user-reaction:`, data);
    const { reaction } = data;
    socket.to(socket.roomId).emit('user-reaction', {
      username: socket.username,
      reaction,
      timestamp: Date.now()
    });
  });

  // Disconnect handling
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId) {
      try {
        const room = await Room.findOne({ roomId: socket.roomId });
        if (room) {
          // Remove user from room
          room.cohosts = room.cohosts.filter(c => c.socketId !== socket.id);
          room.guests = room.guests.filter(g => g.socketId !== socket.id);
          
          // If last cohost leaves, promote a guest
          if (room.cohosts.length === 0 && room.guests.length > 0) {
            const newCohost = room.guests.shift();
            room.cohosts.push(newCohost);
            
            // Update promoted user's role
            const targetSocket = [...io.sockets.sockets.values()]
              .find(s => s.socketId === newCohost.socketId);
            if (targetSocket) {
              targetSocket.role = 'cohost';
              targetSocket.emit('role-updated', { role: 'cohost' });
            }
          }
          
          await room.save();
          
          // Notify remaining users
          socket.to(socket.roomId).emit('user-left', {
            username: socket.username,
            users: [...room.cohosts, ...room.guests]
          });
          
          // Delete room if empty
          if (room.cohosts.length === 0 && room.guests.length === 0) {
            await Room.deleteOne({ roomId: socket.roomId });
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
