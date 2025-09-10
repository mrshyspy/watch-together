import React, { useEffect, useRef, useState } from 'react';

const VideoPlayer = ({ 
  currentVideo, 
  videoState, 
  userRole, 
  onPlay, 
  onPause, 
  onSeek,
  onVideoEnd 
}) => {
  const playerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isUserAction, setIsUserAction] = useState(false);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializePlayer;
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, []);

  const initializePlayer = () => {
    if (playerRef.current && window.YT) {
      const newPlayer = new window.YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId: currentVideo?.videoId || '',
        playerVars: {
          autoplay: 0,
          controls: userRole === 'cohost' ? 1 : 0,
          disablekb: userRole !== 'cohost' ? 1 : 0,
          fs: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange
        }
      });
      setPlayer(newPlayer);
    }
  };

  const onPlayerReady = (event) => {
    setIsReady(true);
    if (videoState.playing) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event) => {
    if (!isReady || !player) return;

    const currentTime = player.getCurrentTime();
    
    // Only emit events if this is a user action (cohost only)
    if (isUserAction && userRole === 'cohost') {
      switch (event.data) {
        case window.YT.PlayerState.PLAYING:
          onPlay(currentTime);
          break;
        case window.YT.PlayerState.PAUSED:
          onPause(currentTime);
          break;
        case window.YT.PlayerState.ENDED:
          onVideoEnd();
          break;
      }
      setIsUserAction(false);
    }
  };

  // Load new video when currentVideo changes
  useEffect(() => {
    if (player && isReady && currentVideo) {
      player.loadVideoById(currentVideo.videoId);
    }
  }, [player, isReady, currentVideo]);

  // Sync video state from socket
  useEffect(() => {
    if (player && isReady && videoState) {
      const currentTime = player.getCurrentTime();
      const stateDiff = Math.abs(currentTime - videoState.position);
      
      // Only sync if the difference is significant (more than 2 seconds)
      if (stateDiff > 2) {
        player.seekTo(videoState.position, true);
      }

      // Sync play/pause state
      const playerState = player.getPlayerState();
      const isPlaying = playerState === window.YT.PlayerState.PLAYING;
      
      if (videoState.playing && !isPlaying) {
        player.playVideo();
      } else if (!videoState.playing && isPlaying) {
        player.pauseVideo();
      }
    }
  }, [player, isReady, videoState]);

  // Handle user interactions (only for cohosts)
  const handlePlayerInteraction = () => {
    if (userRole === 'cohost') {
      setIsUserAction(true);
    }
  };

  if (!currentVideo) {
    return (
      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Video Selected</h3>
          <p className="text-gray-500">Add a YouTube video to start watching together!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <div 
          ref={playerRef} 
          className="w-full h-full"
          onClick={handlePlayerInteraction}
        />
        
        {/* Overlay for guests to prevent interaction */}
        {userRole !== 'cohost' && (
          <div className="absolute inset-0 bg-transparent" />
        )}
      </div>
      
      {/* Video info */}
      <div className="mt-4">
        <h2 className="text-xl font-semibold text-white mb-2">
          {currentVideo.title}
        </h2>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Added by: {currentVideo.addedBy}</span>
          {userRole !== 'cohost' && (
            <span className="text-yellow-400">
              👑 Only cohosts can control playback
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;