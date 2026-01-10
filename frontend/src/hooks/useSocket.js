import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = import.meta.env.VITE_REACT_APP_SERVER_URL || 'http://localhost:5001';

const useSocket = (roomId, currentUser) => {
    const navigate = useNavigate();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoState, setVideoState] = useState({ position: 0, playing: false });
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!roomId || !currentUser) return;

    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join-room', {
        roomId,
        username: currentUser.username,
        role: currentUser.role
      });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('room-joined', (data) => {
      setRoom(data.room);
      setUserRole(data.userRole);
      setUsers([...data.room.cohosts, ...data.room.guests]);
      setPlaylist(data.room.playlist || []);
      setCurrentVideo(data.room.currentVideo);
      setVideoState(data.room.videoState || { position: 0, playing: false });
    });

    newSocket.on('user-joined', (data) => {
      setUsers(data.users);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: `${data.username} joined as ${data.role}`,
        timestamp: new Date()
      }]);
    });

    newSocket.on('user-left', (data) => {
      setUsers(data.users);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: `${data.username} left the room`,
        timestamp: new Date()
      }]);
    });

    newSocket.on('role-updated', (data) => {
      setUserRole(data.role);
    });

    newSocket.on('users-updated', (data) => {
      setUsers([...data.cohosts, ...data.guests]);
    });

    newSocket.on('video-play', (data) => {
      setVideoState({ position: data.position, playing: true, timestamp: data.timestamp });
    });

    newSocket.on('video-pause', (data) => {
      setVideoState({ position: data.position, playing: false, timestamp: data.timestamp });
    });

    newSocket.on('video-seek', (data) => {
      setVideoState(prev => ({ ...prev, position: data.position, timestamp: data.timestamp }));
    });

    newSocket.on('video-changed', (data) => {
      setCurrentVideo(data.currentVideo);
      setVideoState(data.videoState);
    });

    newSocket.on('playlist-updated', (data) => {
      setPlaylist(data.playlist);
      if (data.currentVideo) {
        setCurrentVideo(data.currentVideo);
      }
    });

    newSocket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    newSocket.on('user-reaction', (reaction) => {
      setReactions(prev => [...prev, reaction]);
      // Remove reaction after 3 seconds
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.timestamp !== reaction.timestamp));
      }, 3000);
    });

    newSocket.on('room-locked', () => {
      alert('This room is locked and requires approval to join.');
    });

    newSocket.on('cohost-limit-reached', ({ roomId, message }) => {
      alert(message);

      // Redirect back to join page for same room
      navigate(`/room/${roomId}/join`);
    });

    newSocket.on('room-lock-updated', (data) => {
      setRoom(prev => ({ ...prev, locked: data.locked }));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message);
    });

    return () => {
      newSocket.close();
    };
  }, [roomId, currentUser, navigate]);

  const emitVideoPlay = (position) => {
    if (socket && userRole === 'cohost') {
      socket.emit('video-play', { position, timestamp: Date.now() });
    }
  };

  const emitVideoPause = (position) => {
    if (socket && userRole === 'cohost') {
      socket.emit('video-pause', { position, timestamp: Date.now() });
    }
  };

  const emitVideoSeek = (position) => {
    if (socket && userRole === 'cohost') {
      socket.emit('video-seek', { position, timestamp: Date.now() });
    }
  };

  const addVideo = (videoData) => {
    if (socket) {
      socket.emit('add-video', videoData);
    }
  };

  const removeVideo = (videoId) => {
    if (socket && userRole === 'cohost') {
      socket.emit('remove-video', { videoId });
    }
  };

  const nextVideo = () => {
    if (socket && userRole === 'cohost') {
      socket.emit('next-video');
    }
  };

  const promoteUser = (username) => {
    if (socket && userRole === 'cohost') {
      socket.emit('promote-user', { username });
    }
  };

  const demoteUser = (username) => {
    if (socket && userRole === 'cohost') {
      socket.emit('demote-user', { username });
    }
  };

  const toggleRoomLock = () => {
    if (socket && userRole === 'cohost') {
      socket.emit('toggle-room-lock');
    }
  };

  const sendMessage = (message) => {
    if (socket) {
      socket.emit('chat-message', { message });
    }
  };

  const sendReaction = (reaction) => {
    if (socket) {
      socket.emit('user-reaction', { reaction });
    }
  };
 console.log("Current video:", currentVideo);
  console.log("Video state:", videoState);
    console.log("Video id:", currentVideo?.videoId);
  return {
    socket,
    connected,
    room,
    userRole,
    users,
    playlist,
    currentVideo,
    videoState,
    chatMessages,
    reactions,
    emitVideoPlay,
    emitVideoPause,
    emitVideoSeek,
    addVideo,
    removeVideo,
    nextVideo,
    promoteUser,
    demoteUser,
    toggleRoomLock,
    sendMessage,
    sendReaction
  };
};

export default useSocket;