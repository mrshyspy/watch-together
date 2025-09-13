import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import VideoPlayer from "./VideoPlayer";
import Playlist from "./Playlist";
import UserList from "./UserList";
import Chat from "./Chat";

const RoomPage = ({ currentUser }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("playlist");

  const {
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
    sendReaction,
  } = useSocket(roomId, currentUser);

  // console.log("Current video:", currentVideo);
  console.log("Video state:", videoState);
  //     console.log("Video id:", videoState?.id);
  useEffect(() => {
    if (!currentUser) {
      navigate(`/room/${roomId}/join`);
    }
  }, [currentUser, roomId, navigate]);

  const handleVideoEnd = () => {
    if (userRole === "cohost") {
      nextVideo();
    }
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}/join`;
    navigator.clipboard.writeText(link).then(() => {
      alert("Room link copied to clipboard!");
    });
  };

  const leaveRoom = () => {
    navigate("/");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Redirecting to join room...</p>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Connecting to room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold flex items-center space-x-2">
              <span>🎬</span>
              <span>SyncWatch</span>
            </h1>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-400">
              <span>Room:</span>
              <code className="bg-gray-700 px-2 py-1 rounded">{roomId}</code>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <span
                className={
                  userRole === "cohost" ? "text-purple-300" : "text-green-300"
                }
              >
                {userRole === "cohost" ? "👑" : "👤"} {currentUser.username}
              </span>
              <span className="text-gray-500">|</span>
              <span className={connected ? "text-green-400" : "text-red-400"}>
                {connected ? "🟢 Connected" : "🔴 Disconnected"}
              </span>
            </div>

            <button
              onClick={copyRoomLink}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              📋 Share
            </button>

            <button
              onClick={leaveRoom}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              🚪 Leave
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video player */}
          <div className="lg:col-span-2">
            <VideoPlayer
              currentVideo={currentVideo}
              videoState={videoState}
              userRole={userRole}
              onPlay={emitVideoPlay}
              onPause={emitVideoPause}
              onSeek={emitVideoSeek}
              onVideoEnd={handleVideoEnd}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mobile tabs */}
            <div className="lg:hidden">
              <div className="flex border-b border-gray-700">
                {[
                  { id: "playlist", label: "Playlist", icon: "🎵" },
                  { id: "users", label: "Users", icon: "👥" },
                  { id: "chat", label: "Chat", icon: "💬" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "text-purple-300 border-b-2 border-purple-500"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop layout / Mobile active tab */}
            <div className="grid grid-cols-1 gap-6 h-96 lg:h-auto">
              {(activeTab === "playlist" || window.innerWidth >= 1024) && (
                <div
                  className={`${
                    activeTab !== "playlist" ? "hidden lg:block" : ""
                  }`}
                >
                  <Playlist
                    playlist={playlist}
                    currentVideo={currentVideo}
                    userRole={userRole}
                    onAddVideo={addVideo}
                    onRemoveVideo={removeVideo}
                    onNextVideo={nextVideo}
                  />
                </div>
              )}

              {(activeTab === "users" || window.innerWidth >= 1024) && (
                <div
                  className={`${
                    activeTab !== "users" ? "hidden lg:block" : ""
                  }`}
                >
                  <UserList
                    users={users}
                    currentUsername={currentUser.username}
                    userRole={userRole}
                    room={room}
                    onPromoteUser={promoteUser}
                    onDemoteUser={demoteUser}
                    onToggleRoomLock={toggleRoomLock}
                  />
                </div>
              )}

              {(activeTab === "chat" || window.innerWidth >= 1024) && (
                <div
                  className={`${activeTab !== "chat" ? "hidden lg:block" : ""}`}
                >
                  <Chat
                    messages={chatMessages}
                    reactions={reactions}
                    currentUsername={currentUser.username}
                    onSendMessage={sendMessage}
                    onSendReaction={sendReaction}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating reactions */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {reactions.map((reaction, index) => {
          const left = 10 + ((index * 20) % 80); // spread out horizontally
          const top = 30 + Math.random() * 40; // keep within middle vertical range
          const duration = 1.5 + Math.random() * 1.5; // 1.5s–3s animation

          return (
            <div
              key={`${reaction.username}-${reaction.timestamp}-${index}`}
              className="absolute text-4xl animate-bounce"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                animationDuration: `${duration}s`,
              }}
            >
              {reaction.reaction}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomPage;
