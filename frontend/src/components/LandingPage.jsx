import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const LandingPage = () => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

   const createRoom = () => {
    const newRoomId = uuidv4();
    localStorage.removeItem('currentUser');
    navigate(`/room/${newRoomId}/join`);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      localStorage.removeItem('currentUser');
      navigate(`/room/${roomId.trim()}/join`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">SyncTube</h1>
          <p className="text-gray-300">Watch YouTube videos together in sync</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <div className="space-y-6">
            <button
              onClick={createRoom}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Create New Room
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-400"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-300">or</span>
              </div>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-gray-300/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
              <button
                onClick={joinRoom}
                disabled={!roomId.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
               Join Room
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Create a room to watch together with friends!</p>
          {/* <p className="mt-2">🎥 Synchronized playback • 🎵 Shared playlists • 👥 Role management</p> */}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
