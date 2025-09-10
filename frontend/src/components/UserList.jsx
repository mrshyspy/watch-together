import React from 'react';

const UserList = ({ users, userRole, promoteUser, demoteUser, currentUsername }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-2">Users</h3>
      <ul>
        {users.map(user => (
          <li key={user.socketId || user.username} className="flex items-center py-2 px-2 rounded">
            <span className={`font-semibold ${user.role === 'cohost' ? 'text-yellow-400' : 'text-green-300'}`}>{user.username}</span>
            <span className="ml-2 text-xs text-gray-400">({user.role})</span>
            {userRole === 'cohost' && user.username !== currentUsername && (
              <>
                {user.role === 'guest' && (
                  <button onClick={() => promoteUser(user.username)} className="ml-2 text-purple-400 hover:text-purple-600">Promote</button>
                )}
                {user.role === 'cohost' && (
                  <button onClick={() => demoteUser(user.username)} className="ml-2 text-red-400 hover:text-red-600">Demote</button>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
