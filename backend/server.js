import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import Room from './models/room.js';
import User from './models/user.js';
import youtubeRoutes from './routes/youtube.js';

const app = express();
const server = http.createServer(app);

const DEFAULT_CLIENT = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: DEFAULT_CLIENT,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({ origin: DEFAULT_CLIENT }));
app.use(express.json());

// ES modules helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});


// Logging
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

mongoose.connection.on('connected', () => console.log('MongoDB connected'));
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));

// Routes
console.log('Registering /api/youtube routes');
app.use('/api/youtube', youtubeRoutes);

// Helper for cohost-only socket events
function onlyCohost(socket, callback) {
  if (socket.role !== 'cohost') return;
  callback();
}

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async (data) => {
    console.log(`[Socket] join-room:`, data);
    const { roomId, username, role } = data;

    try {
      let room = await Room.findOne({ roomId });

      if (!room) {
        room = new Room({
          roomId,
          cohosts: role === 'cohost' ? [{ socketId: socket.id, username }] : [],
          guests: role === 'guest' ? [{ socketId: socket.id, username }] : [],
          playlist: [],
          currentVideo: null,
          videoState: { position: 0, playing: false, timestamp: Date.now() },
          locked: false
        });
        await room.save();
      } else {
        if (room.locked && role === 'guest') {
          socket.emit('room-locked', { roomId });
          return;
        }

        if (role === 'cohost' && room.cohosts.length >= 2) {
          socket.emit('cohost-limit-reached');
          return;
        }

        if (role === 'cohost') room.cohosts.push({ socketId: socket.id, username });
        else room.guests.push({ socketId: socket.id, username });

        await room.save();
      }

      socket.join(roomId);
      socket.roomId = roomId;
      socket.username = username;
      socket.role = role;

      // Send room data with synced video position
      const elapsed = (Date.now() - room.videoState.timestamp) / 1000;
      const syncedPosition = room.videoState.playing 
        ? room.videoState.position + elapsed 
        : room.videoState.position;

      socket.emit('room-joined', {
        room: room,
        userRole: role,
        syncedVideoState: { ...room.videoState, position: syncedPosition }
      });

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

  // Video controls
  socket.on('video-play', (data) => onlyCohost(socket, async () => {
    const { position, timestamp } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    room.videoState = { position, playing: true, timestamp };
    await room.save();
    socket.to(socket.roomId).emit('video-play', { position, timestamp });
  }));

  socket.on('video-pause', (data) => onlyCohost(socket, async () => {
    const { position, timestamp } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    room.videoState = { position, playing: false, timestamp };
    await room.save();
    socket.to(socket.roomId).emit('video-pause', { position, timestamp });
  }));

  socket.on('video-seek', (data) => onlyCohost(socket, async () => {
    const { position, timestamp } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    room.videoState = { ...room.videoState, position, timestamp };
    await room.save();
    socket.to(socket.roomId).emit('video-seek', { position, timestamp });
  }));

  // Playlist
  socket.on('add-video', async (data) => {
    console.log(`[Socket] add-video:`, data);
    const { videoId, title, thumbnail, duration } = data;
    const room = await Room.findOne({ roomId: socket.roomId });

    const video = { id: uuidv4(), videoId, title, thumbnail, duration, addedBy: socket.username };
    room.playlist.push(video);
    if (!room.currentVideo) room.currentVideo = video;

    await room.save();

    io.to(socket.roomId).emit('playlist-updated', {
      playlist: room.playlist,
      currentVideo: room.currentVideo
    });
  });

  socket.on('remove-video', (data) => onlyCohost(socket, async () => {
    const { videoId } = data;
    const room = await Room.findOne({ roomId: socket.roomId });
    room.playlist = room.playlist.filter(v => v.id !== videoId);
    await room.save();
    io.to(socket.roomId).emit('playlist-updated', {
      playlist: room.playlist,
      currentVideo: room.currentVideo
    });
  }));

  socket.on('next-video', () => onlyCohost(socket, async () => {
    const room = await Room.findOne({ roomId: socket.roomId });
    if (!room.playlist.length) return;

    const currentIndex = room.playlist.findIndex(v => v.id === room.currentVideo?.id);
    const nextIndex = (currentIndex + 1) % room.playlist.length;
    room.currentVideo = room.playlist[nextIndex];
    room.videoState = { position: 0, playing: true, timestamp: Date.now() };
    await room.save();

    io.to(socket.roomId).emit('video-changed', {
      currentVideo: room.currentVideo,
      videoState: room.videoState
    });
  }));

  // User roles
  socket.on('promote-user', (data) => onlyCohost(socket, async () => {
    const { username } = data;
    const room = await Room.findOne({ roomId: socket.roomId });

    const guestIndex = room.guests.findIndex(g => g.username === username);
    if (guestIndex !== -1 && room.cohosts.length < 2) {
      const guest = room.guests.splice(guestIndex, 1)[0];
      room.cohosts.push(guest);
      await room.save();

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
  }));

  socket.on('demote-user', (data) => onlyCohost(socket, async () => {
    const { username } = data;
    const room = await Room.findOne({ roomId: socket.roomId });

    const cohostIndex = room.cohosts.findIndex(c => c.username === username);
    if (cohostIndex !== -1) {
      const cohost = room.cohosts.splice(cohostIndex, 1)[0];
      room.guests.push(cohost);
      await room.save();

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
  }));

  socket.on('toggle-room-lock', () => onlyCohost(socket, async () => {
    const room = await Room.findOne({ roomId: socket.roomId });
    room.locked = !room.locked;
    await room.save();
    io.to(socket.roomId).emit('room-lock-updated', { locked: room.locked });
  }));

  // Chat
  socket.on('chat-message', (data) => {
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
    const { reaction } = data;
    socket.to(socket.roomId).emit('user-reaction', {
      username: socket.username,
      reaction,
      timestamp: Date.now()
    });
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);

    if (!socket.roomId) return;

    try {
      const room = await Room.findOne({ roomId: socket.roomId });
      if (!room) return;

      room.cohosts = room.cohosts.filter(c => c.socketId !== socket.id);
      room.guests = room.guests.filter(g => g.socketId !== socket.id);

      if (room.cohosts.length === 0 && room.guests.length > 0) {
        const newCohost = room.guests.shift();
        room.cohosts.push(newCohost);

        const targetSocket = [...io.sockets.sockets.values()]
          .find(s => s.socketId === newCohost.socketId);
        if (targetSocket) {
          targetSocket.role = 'cohost';
          targetSocket.emit('role-updated', { role: 'cohost' });
        }

        io.to(socket.roomId).emit('users-updated', {
          cohosts: room.cohosts,
          guests: room.guests
        });
      }

      await room.save();

      socket.to(socket.roomId).emit('user-left', {
        username: socket.username,
        users: [...room.cohosts, ...room.guests]
      });

      if (room.cohosts.length === 0 && room.guests.length === 0) {
        await Room.deleteOne({ roomId: socket.roomId });
      }

    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });

});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
