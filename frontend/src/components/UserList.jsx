import React, { useState } from 'react';

const UserList = ({ 
  users, 
  currentUsername, 
  userRole, 
  room,
  onPromoteUser, 
  onDemoteUser, 
  onToggleRoomLock 
}) => {
  const [showManagement, setShowManagement] = useState(false);

  const cohosts = users.filter(user => 
    room?.cohosts?.some(c => c.username === user.username)
  );
  
  const guests = users.filter(user => 
    room?.guests?.some(g => g.username === user.username)
  );

  const canPromote = (username) => {
    return userRole === 'cohost' && 
           username !== currentUsername && 
           cohosts.length < 2 &&
           guests.some(g => g.username === username);
  };

  const canDemote = (username) => {
    return userRole === 'cohost' && 
           username !== currentUsername &&
           cohosts.some(c => c.username === username);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span>👥</span>
          <span>Users ({users.length})</span>
        </h3>
        
        {userRole === 'cohost' && (
          <div className="flex space-x-2">
            <button
              onClick={onToggleRoomLock}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                room?.locked 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={room?.locked ? 'Unlock room' : 'Lock room'}
            >
              {room?.locked ? '🔒' : '🔓'}
            </button>
            
            <button
              onClick={() => setShowManagement(!showManagement)}
              className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
              title="Manage users"
            >
              ⚙️
            </button>
          </div>
        )}
      </div>

      {room?.locked && (
        <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-300 text-sm flex items-center">
            <span className="mr-2">🔒</span>
            Room is locked - new guests need approval
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* Cohosts */}
        {cohosts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center">
              <span className="mr-2">👑</span>
              Cohosts ({cohosts.length}/2)
            </h4>
            <div className="space-y-2">
              {cohosts.map(user => (
                <div
                  key={user.username}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    user.username === currentUsername 
                      ? 'bg-purple-600/30 border border-purple-500/50' 
                      : 'bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👑</span>
                    <span className={`font-medium ${
                      user.username === currentUsername ? 'text-purple-300' : 'text-white'
                    }`}>
                      {user.username}
                      {user.username === currentUsername && ' (You)'}
                    </span>
                  </div>
                  
                  {showManagement && canDemote(user.username) && (
                    <button
                      onClick={() => onDemoteUser(user.username)}
                      className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors duration-200"
                    >
                      Demote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guests */}
        {guests.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-300 mb-2 flex items-center">
              <span className="mr-2">👤</span>
              Guests ({guests.length})
            </h4>
            <div className="space-y-2">
              {guests.map(user => (
                <div
                  key={user.username}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    user.username === currentUsername 
                      ? 'bg-green-600/30 border border-green-500/50' 
                      : 'bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👤</span>
                    <span className={`font-medium ${
                      user.username === currentUsername ? 'text-green-300' : 'text-white'
                    }`}>
                      {user.username}
                      {user.username === currentUsername && ' (You)'}
                    </span>
                  </div>
                  
                  {showManagement && canPromote(user.username) && (
                    <button
                      onClick={() => onPromoteUser(user.username)}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors duration-200"
                    >
                      Promote
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {users.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <div className="text-2xl mb-2">👻</div>
          <p className="text-sm">No users in room</p>
        </div>
      )}

      {/* Role explanations */}
      <div className="mt-4 pt-4 border-t border-gray-600">
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>👑</span>
            <span>Cohosts can control video and manage playlist</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>👤</span>
            <span>Guests watch in sync but cannot control</span>
          </div>
          {userRole === 'cohost' && (
            <div className="flex items-center space-x-2">
              <span>⚙️</span>
              <span>Click manage button to promote/demote users</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserList;