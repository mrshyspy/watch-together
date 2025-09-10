import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import YouTube from 'react-youtube';
import axios from 'axios';

const socket = io();

export default function Room() {
  const { roomId } = useParams();
  const [roomState, setRoomState] = useState({
    playlist: [],
    currentIndex: 0,
    currentTime: 0,
    isPlaying: false,
    participants: [],
    pending: [],
    locked: false,
    activityLog: [],
  });
  const [userId, setUserId] = useState('');
  const [isCohost, setIsCohost] = useState(false);
  const [player, setPlayer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [reactions, setReactions] = useState([]);
  const syncInterval = useRef(null);

  useEffect(() => {
    // Listen for updates
    socket.on('roomJoined', ({ userId: uid, roomState: state }) => {
      setUserId(uid);
      updateState(state);
    });
    socket.on('approved', ({ userId: uid, roomState: state }) => {
      setUserId(uid);
      updateState(state);
      socket.join(roomId);
    });
    socket.on('updatePlaylist', (playlist) => updateState({ playlist }));
    socket.on('updatePlayback', (updates) => {
      updateState(updates);
      applyPlayback(updates);
    });
    socket.on('updateParticipants', (participants) => updateState({ participants }));
    socket.on('updatePending', (pending) => updateState({ pending }));
    socket.on('updateLock', (locked) => updateState({ locked }));
    socket.on('newActivity', (log) => updateState({ activityLog: [...roomState.activityLog, log] }));
    socket.on('newMessage', (msg) => setMessages([...messages, msg]));
    socket.on('newReaction', (reaction) => setReactions([...reactions, reaction])); // Display briefly
    socket.on('cohostRequest', ({ userId }) => {
      if (isCohost) alert(`User ${userId} requests cohost`); // Or modal
    });

    // Request cohost
    const handleRequest = () => socket.emit('requestCohost');

    // Cleanup
    return () => {
      socket.off();
      clearInterval(syncInterval.current);
    };
  }, [roomState, isCohost]);

  const updateState = (newState) => {
    setRoomState((prev) => ({ ...prev, ...newState }));
    setIsCohost(roomState.participants.find(p => p.userId === userId)?.role === 'cohost');
  };

  const applyPlayback = ({ currentIndex, currentTime, isPlaying }) => {
    if (player) {
      if (currentIndex !== undefined) player.cueVideoById(roomState.playlist[currentIndex]?.videoId);
      if (currentTime !== undefined) player.seekTo(currentTime, true);
      if (isPlaying !== undefined) isPlaying ? player.playVideo() : player.pauseVideo();
    }
  };

  const handleReady = (event) => {
    setPlayer(event.target);
    applyPlayback(roomState); // Initial sync
    if (isCohost) {
      syncInterval.current = setInterval(() => {
        socket.emit('syncTime', event.target.getCurrentTime());
      }, 5001);
    }
  };

  const handleStateChange = (event) => {
    if (event.data === 0 && isCohost) { // Ended
      socket.emit('next');
    }
  };

  const handlePlay = () => socket.emit('play');
  const handlePause = () => socket.emit('pause');
  const handleSeek = (e) => socket.emit('seek', parseFloat(e.target.value));
  const handleAddVideo = async (url) => {
    const videoId = new URLSearchParams(new URL(url).search).get('v');
    if (videoId) {
      const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`);
      const video = { videoId, title: res.data.items[0].snippet.title, thumbnail: res.data.items[0].snippet.thumbnails.default.url };
      socket.emit('addVideo', video);
    }
  };

  const handleImportPlaylist = async (playlistUrl) => {
    const playlistId = new URLSearchParams(new URL(playlistUrl).search).get('list');
    let videos = [];
    let pageToken = '';
    do {
      const res = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&pageToken=${pageToken}&key=${process.env.REACT_APP_YOUTUBE_API_KEY}`);
      videos = [...videos, ...res.data.items.map(item => ({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.default.url
      }))];
      pageToken = res.data.nextPageToken;
    } while (pageToken);
    videos.forEach(video => socket.emit('addVideo', video));
  };

  const handleRemoveVideo = (index) => socket.emit('removeVideo', index);
  const handlePromote = (uid) => socket.emit('promote', { targetUserId: uid });
  const handleDemote = (uid) => socket.emit('demote', { targetUserId: uid });
  const handleApprove = (uid) => socket.emit('approveJoin', { userId: uid });
  const handleLock = () => socket.emit('lockRoom', !roomState.locked);
  const sendMessage = () => {
    socket.emit('message', { user: userId, text: message });
    setMessage('');
  };
  const sendReaction = (reaction) => socket.emit('reaction', { user: userId, reaction });

  return (
    <div className="grid grid-cols-4 h-screen">
      {/* Video Player */}
      <div className="col-span-3 flex justify-center items-center bg-black">
        {roomState.playlist.length > 0 && (
          <YouTube
            videoId={roomState.playlist[roomState.currentIndex]?.videoId}
            opts={{ width: '100%', height: '100%', playerVars: { controls: isCohost ? 0 : 0, autoplay: 1 } }} // Hide controls for all, use custom
            onReady={handleReady}
            onStateChange={handleStateChange}
          />
        )}
      </div>

      {/* Sidebar: Playlist, Users, Chat */}
      <div className="col-span-1 p-4 bg-gray-100 overflow-y-auto">
        <h2 className="text-xl mb-2">Playlist</h2>
        <ul>
          {roomState.playlist.map((video, idx) => (
            <li key={idx} className={`flex items-center mb-2 ${idx === roomState.currentIndex ? 'bg-blue-200' : ''}`}>
              <img src={video.thumbnail} alt="thumb" className="w-16 h-9 mr-2" />
              {video.title}
              {isCohost && <button onClick={() => handleRemoveVideo(idx)} className="ml-auto text-red-500">Remove</button>}
            </li>
          ))}
        </ul>
        {isCohost && (
          <>
            <input type="text" placeholder="Add YouTube URL" onKeyDown={(e) => e.key === 'Enter' && handleAddVideo(e.target.value)} className="border p-1 mb-2 w-full" />
            <input type="text" placeholder="Import Playlist URL" onKeyDown={(e) => e.key === 'Enter' && handleImportPlaylist(e.target.value)} className="border p-1 mb-2 w-full" />
          </>
        )}

        <h2 className="text-xl mt-4 mb-2">Users</h2>
        <ul>
          {roomState.participants.map((p) => (
            <li key={p.userId} className="mb-1">
              {p.name} ({p.role})
              {isCohost && p.userId !== userId && (
                <>
                  {p.role === 'guest' && <button onClick={() => handlePromote(p.userId)} className="text-green-500 ml-2">Promote</button>}
                  {p.role === 'cohost' && <button onClick={() => handleDemote(p.userId)} className="text-red-500 ml-2">Demote</button>}
                </>
              )}
            </li>
          ))}
        </ul>
        {isCohost && roomState.pending.length > 0 && (
          <>
            <h3>Pending Joins</h3>
            <ul>
              {roomState.pending.map((p) => (
                <li key={p.userId}>{p.name} <button onClick={() => handleApprove(p.userId)} className="text-green-500">Approve</button></li>
              ))}
            </ul>
          </>
        )}
        {isCohost && <button onClick={handleLock} className="bg-yellow-500 text-white p-1 mt-2">{roomState.locked ? 'Unlock' : 'Lock'} Room</button>}
        {!isCohost && <button onClick={() => socket.emit('requestCohost')} className="bg-blue-500 text-white p-1 mt-2">Request Cohost</button>}

        <h2 className="text-xl mt-4 mb-2">Controls (Cohosts Only)</h2>
        {isCohost && (
          <div className="flex mb-2">
            <button onClick={handlePlay} className="bg-green-500 text-white p-2 mr-2">Play</button>
            <button onClick={handlePause} className="bg-red-500 text-white p-2 mr-2">Pause</button>
            <input type="range" min="0" max={player?.getDuration() || 0} value={roomState.currentTime} onChange={handleSeek} className="flex-1" />
          </div>
        )}

        <h2 className="text-xl mt-4 mb-2">Chat</h2>
        <ul className="mb-2">
          {messages.map((m, idx) => <li key={idx}>{m.user}: {m.text}</li>)}
        </ul>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className="border p-1 w-full" />
        <button onClick={sendMessage} className="bg-blue-500 text-white p-1 mt-2">Send</button>

        <h2 className="text-xl mt-4 mb-2">Reactions</h2>
        <button onClick={() => sendReaction('👍')} className="mr-2">👍</button>
        <button onClick={() => sendReaction('❤️')} className="mr-2">❤️</button>
        <button onClick={() => sendReaction('😂')} className="mr-2">😂</button>
        {/* Display reactions as floating overlays or list */}

        <h2 className="text-xl mt-4 mb-2">Activity Log</h2>
        <ul>
          {roomState.activityLog.map((log, idx) => <li key={idx}>{log.timestamp}: {log.message}</li>)}
        </ul>
      </div>
    </div>
  );
}