import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const RoleSelection = ({ setCurrentUser }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [selectedRole, setSelectedRole] = useState('guest');
  const [isJoining, setIsJoining] = useState(false);

  const joinRoom = async () => {
    if (!username.trim()) return;

    setIsJoining(true);
    
    const userData = {
      username: username.trim(),
      role: selectedRole,
      roomId
    };

    setCurrentUser(userData);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4"></div>
          <h1 className="text-3xl font-bold text-white mb-2">Join Room</h1>
          <p className="text-gray-300">Room ID: <span className="font-mono text-purple-300">{roomId}</span></p>
        </div>

        <div className="glass rounded-xl p-8 shadow-2xl">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-gray-300/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-4">
                Choose Your Role
              </label>
              <div className="space-y-3">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedRole === 'cohost' 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : 'border-gray-600 bg-white/10 hover:border-purple-400'
                  }`}
                  onClick={() => setSelectedRole('cohost')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cohost"
                      name="role"
                      value="cohost"
                      checked={selectedRole === 'cohost'}
                      onChange={() => setSelectedRole('cohost')}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">👑</span>
                      <div>
                        <h3 className="font-semibold text-white">Cohost</h3>
                        <p className="text-sm text-gray-300">Control video playback and manage playlist</p>
                        <p className="text-xs text-purple-300 mt-1">Max 2 cohosts per room</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedRole === 'guest' 
                      ? 'border-green-500 bg-green-500/20' 
                      : 'border-gray-600 bg-white/10 hover:border-green-400'
                  }`}
                  onClick={() => setSelectedRole('guest')}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="guest"
                      name="role"
                      value="guest"
                      checked={selectedRole === 'guest'}
                      onChange={() => setSelectedRole('guest')}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <h3 className="font-semibold text-white">Guest</h3>
                        <p className="text-sm text-gray-300">Watch and enjoy the synchronized experience</p>
                        <p className="text-xs text-green-300 mt-1">Can be promoted to cohost later</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={joinRoom}
              disabled={!username.trim() || isJoining}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Joining Room...</span>
                </>
              ) : (
                <>
                  <span className="text-xl"></span>
                  <span>Join Room</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
