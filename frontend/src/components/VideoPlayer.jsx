import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";

const VideoPlayer = ({ socket, currentVideo, userRole, videoState }) => {
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncTime = useRef(0);

  // Logger util
  const log = (scope, message, data = null) => {
    const prefix = `[VideoPlayer][${scope}]`;
    if (data !== null) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  };

  // Apply videoState from socket
  useEffect(() => {
    if (playerRef.current && isReady && videoState && userRole === "guest") {
      const now = Date.now();
      if (now - lastSyncTime.current > 1000) {
        log("SYNC", "Applying videoState from socket", videoState);
        syncToState(videoState);
        lastSyncTime.current = now;
      }
    }
  }, [videoState, isReady, userRole]);

  // YouTube Events
  const onPlayerReady = (event) => {
    log("PLAYER", "Player ready", { videoId: currentVideo?.videoId });
    playerRef.current = event.target;
    setIsReady(true);

    if (videoState && userRole === "guest") {
      log("PLAYER", "Guest syncing initial state", videoState);
      syncToState(videoState);
    }
  };

  const onPlayerStateChange = (event) => {
    if (!socket || userRole !== "cohost" || isSyncing) return;

    const currentTime = playerRef.current?.getCurrentTime?.() || 0;
    const timestamp = Date.now();

    // Guard against missing YT global
    const PlayerState = typeof window !== "undefined" ? window?.YT?.PlayerState : undefined;
    if (PlayerState) {
      switch (event.data) {
        case PlayerState.PLAYING:
          log("PLAYER", "Cohost played video", { currentTime });
          socket.emit("video-play", { position: currentTime, timestamp });
          break;
        case PlayerState.PAUSED:
          log("PLAYER", "Cohost paused video", { currentTime });
          socket.emit("video-pause", { position: currentTime, timestamp });
          break;
        default:
          log("PLAYER", "Unhandled state change", { state: event.data });
      }
    } else {
      // Fallback: handle common numeric states (1=playing,2=paused)
      if (event.data === 1) {
        log("PLAYER", "Cohost played video (fallback numeric)", { currentTime });
        socket.emit("video-play", { position: currentTime, timestamp });
      } else if (event.data === 2) {
        log("PLAYER", "Cohost paused video (fallback numeric)", { currentTime });
        socket.emit("video-pause", { position: currentTime, timestamp });
      } else {
        log("PLAYER", "Unhandled state change (no YT)", { state: event.data });
      }
    }
  };

  const syncToState = (state, attempt = 0) => {
    const MAX_ATTEMPTS = 6;
    const RETRY_DELAY = 500; // ms

    if (!playerRef.current || !isReady || isSyncing) {
      log("SYNC", "Skipped sync (player not ready or already syncing)");
      return;
    }

    // Defensive: ensure iframe exists and has a src before posting messages to it
    const iframe = typeof playerRef.current.getIframe === "function"
      ? playerRef.current.getIframe()
      : null;
    if (!iframe || !iframe.src) {
      if (attempt < MAX_ATTEMPTS) {
        log("SYNC", "Iframe not ready, retrying...", { attempt });
        setTimeout(() => syncToState(state, attempt + 1), RETRY_DELAY);
      } else {
        log("SYNC", "Iframe never became ready, aborting sync");
      }
      return;
    }

    setIsSyncing(true);
    const { position, playing, timestamp } = state;
    const timeDiff = (Date.now() - timestamp) / 1000;
    const targetTime = playing ? position + timeDiff : position;

    log("SYNC", "Syncing player", { targetTime, playing, original: state });

    try {
      if (typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(targetTime, true);
      }

      setTimeout(() => {
        if (!playerRef.current) return;

        try {
          if (playing) {
            log("SYNC", "Ensuring video is playing");
            playerRef.current.playVideo?.();
          } else {
            log("SYNC", "Ensuring video is paused");
            playerRef.current.pauseVideo?.();
          }
        } catch (err) {
          console.error("SYNC: player control error:", err);
        } finally {
          setIsSyncing(false);
          log("SYNC", "Sync complete");
        }
      }, 500);
    } catch (err) {
      console.error("SYNC: unexpected error while syncing:", err);
      setIsSyncing(false);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    log("SOCKET", "Registering socket listeners");

    const handleVideoPlay = (data) => {
      log("SOCKET", "Received video-play", data);
      if (userRole === "guest") {
        syncToState({ ...data, playing: true });
      }
    };

    const handleVideoPause = (data) => {
      log("SOCKET", "Received video-pause", data);
      if (userRole === "guest") {
        syncToState({ ...data, playing: false });
      }
    };

    const handleVideoSeek = (data) => {
      log("SOCKET", "Received video-seek", data);
      if (userRole === "guest") {
        const PlayerState = typeof window !== "undefined" ? window?.YT?.PlayerState : undefined;
        const isPlaying = PlayerState ? playerRef.current?.getPlayerState() === PlayerState.PLAYING : playerRef.current?.getPlayerState() === 1;
        syncToState({
          ...data,
          playing: isPlaying,
        });
      }
    };

    const handleVideoChanged = (data) => {
      log("SOCKET", "Received video-changed", data);
      if (data.currentVideo && playerRef.current) {
        try {
          playerRef.current.loadVideoById(data.currentVideo.videoId);
        } catch (err) {
          console.error("SOCKET: loadVideoById error:", err);
        }
        // Use syncToState which will retry until iframe is ready
        syncToState(data.videoState);
      }
    };

    socket.on("video-play", handleVideoPlay);
    socket.on("video-pause", handleVideoPause);
    socket.on("video-seek", handleVideoSeek);
    socket.on("video-changed", handleVideoChanged);

    return () => {
      log("SOCKET", "Cleaning up socket listeners");
      socket.off("video-play", handleVideoPlay);
      socket.off("video-pause", handleVideoPause);
      socket.off("video-seek", handleVideoSeek);
      socket.off("video-changed", handleVideoChanged);
    };
  }, [socket, userRole, isReady]);

  const handleNextVideo = () => {
    if (userRole === "cohost" && socket) {
      log("UI", "Cohost requested next video");
      socket.emit("next-video");
    }
  };

  // YouTube Player Options
  const opts = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      disablekb: 0,
      enablejsapi: 1,
      modestbranding: 1,
      // origin: window.location.origin, // ✅ fixed cross-origin
    },
  };

  return (
    <div className="relative">
      <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
        <div className="relative aspect-video">
          {currentVideo ? (
            <YouTube
              videoId={currentVideo.videoId}
              opts={opts}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              className="w-full h-full" // ✅ kept it
              iframeClassName="w-full h-full" // ✅ kept
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📺</div>
                <p className="text-xl">No video selected</p>
                <p className="text-sm">
                  Add a video to the playlist to get started
                </p>
              </div>
            </div>
          )}
          {userRole === "guest" && currentVideo && (
            <div className="absolute inset-0 bg-transparent z-10"></div>
          )}
        </div>
      </div>

      {currentVideo && (
        <div className="mt-4 p-4 bg-gray-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {currentVideo.title}
              </h3>
              <p className="text-sm text-gray-400">
                Added by {currentVideo.addedBy}
              </p>
            </div>

            {userRole === "cohost" && (
              <button
                onClick={handleNextVideo}
                className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <span>⏭️</span>
                <span>Next</span>
              </button>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 z-20">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            userRole === "cohost"
              ? "bg-purple-600 text-white"
              : "bg-gray-600 text-gray-300"
          }`}
        >
          {userRole === "cohost" ? "👑 Cohost" : "👤 Guest"}
        </div>
      </div>

      {isSyncing && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Syncing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
