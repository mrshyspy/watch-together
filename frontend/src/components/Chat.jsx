import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ 
  messages, 
  reactions,
  onSendMessage, 
  onSendReaction,
  currentUsername 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '🔥', '👏', '💯'];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
      chatInputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReaction = (emoji) => {
    onSendReaction(emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <span>💬</span>
          <span>Chat</span>
        </h3>
        
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            title="Quick reactions"
          >
            😊
          </button>
          
          {showEmojiPicker && (
            <div className="absolute right-0 mt-2 bg-gray-700 rounded-lg p-2 shadow-lg z-10 grid grid-cols-5 gap-1">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="p-2 hover:bg-gray-600 rounded text-lg transition-colors duration-200"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">💭</div>
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-2 rounded-lg ${
                message.type === 'system' 
                  ? 'bg-blue-900/30 text-blue-300' 
                  : message.username === currentUsername
                    ? 'bg-purple-600/30 text-purple-100 ml-4'
                    : 'bg-gray-700/50 text-gray-100 mr-4'
              }`}
            >
              {message.type === 'system' ? (
                <div className="text-xs text-center">
                  <span>ℹ️ {message.message}</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {message.role === 'cohost' ? '👑' : '👤'} {message.username}
                      </span>
                      {message.username === currentUsername && (
                        <span className="text-xs text-purple-300">(You)</span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm break-words">{message.message}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reactions overlay */}
      {reactions.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {reactions.map(reaction => (
            <div
              key={reaction.timestamp}
              className="absolute animate-bounce text-2xl"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 60 + 20}%`,
                animation: 'bounce 3s ease-out forwards'
              }}
            >
              {reaction.reaction}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex space-x-2">
        <textarea
          ref={chatInputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
          rows="2"
          maxLength={500}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium"
        >
          Send
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-1 text-right">
        {newMessage.length}/500
      </div>
    </div>
  );
};

export default Chat;