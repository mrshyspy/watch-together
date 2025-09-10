import React, { useState, useRef, useEffect } from 'react';

const Chat = ({ messages, reactions, sendMessage, sendReaction, userRole }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg p-4">
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`mb-1 ${msg.type === 'system' ? 'text-gray-400 text-xs' : ''}`}>
            {msg.type === 'system' ? (
              <span>{msg.message}</span>
            ) : (
              <span><span className="font-semibold text-purple-300">{msg.username || 'You'}</span>: {msg.message}</span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 px-4 py-2 rounded text-white font-semibold hover:bg-blue-700"
        >
          Send
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => sendReaction('👍')} className="text-xl">👍</button>
        <button onClick={() => sendReaction('❤️')} className="text-xl">❤️</button>
        <button onClick={() => sendReaction('😂')} className="text-xl">😂</button>
      </div>
      {/* Show reactions as floating overlays */}
      <div className="absolute bottom-16 left-4 flex gap-2 pointer-events-none">
        {reactions.map((r, idx) => (
          <span key={idx} className="text-2xl animate-bounce-slow">{r.reaction}</span>
        ))}
      </div>
    </div>
  );
};

export default Chat;
