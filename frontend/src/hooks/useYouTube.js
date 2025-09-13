import { useState, useEffect, useRef } from "react";

const useYouTube = () => {
  const [player, setPlayer] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const apiReadyRef = useRef(false);
  const pendingPlayer = useRef(null);

  useEffect(() => {
    console.log("[YouTube] useEffect: Checking API...");
    window.onYouTubeIframeAPIReady = () => {
      console.log("✅ [YouTube] IFrame API ready");
      apiReadyRef.current = true;

      // if a player was requested before API was ready, create it now
      if (pendingPlayer.current) {
        const { elementId, videoId, onReady, onStateChange } =
          pendingPlayer.current;
        createPlayer(elementId, videoId, onReady, onStateChange);
        pendingPlayer.current = null;
      }
    };

    if (!window.YT) {
      console.log("[YouTube] Loading IFrame API script...");
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    } else {
      console.log("[YouTube] IFrame API already loaded.");
      apiReadyRef.current = true;
    }

    return () => {
      if (player) {
        console.log("[YouTube] Destroying player...");
        player.destroy();
      }
    };
  }, []);

  const createPlayer = (elementId, videoId, onReady, onStateChange) => {
    console.log(`[YouTube] Attempting to create player for videoId=${videoId}`);
    if (window.YT && window.YT.Player && apiReadyRef.current) {
      const newPlayer = new window.YT.Player(elementId, {
        height: "100%",
        width: "100%",
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          disablekb: 0,
          enablejsapi: 1,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            console.log("[YouTube] Player ready event fired.");
            setPlayer(event.target);
            setIsReady(true);
            onReady?.(event);
          },
          onStateChange: (event) => {
            console.log(`[YouTube] Player state changed: ${event.data}`);
            onStateChange?.(event);
          },
          onError: (event) => {
            console.error(`[YouTube] Player error: ${event.data}`);
          }
        },
      });
      setPlayer(newPlayer);
      console.log("[YouTube] Player created.");
    } else {
      console.warn("[YouTube] API not ready yet! Deferring player creation.");
      pendingPlayer.current = { elementId, videoId, onReady, onStateChange };
    }
  };

  const getPlayerState = () => {
    if (player && isReady) {
      console.log("[YouTube] Getting player state...");
      return {
        state: player.getPlayerState(),
        currentTime: player.getCurrentTime(),
        duration: player.getDuration(),
      };
    }
    console.warn("[YouTube] Player not ready for state query.");
    return null;
  };

  const playVideo = () => {
    console.log("[YouTube] playVideo called.");
    player?.playVideo();
  };

  const pauseVideo = () => {
    console.log("[YouTube] pauseVideo called.");
    player?.pauseVideo();
  };

  const seekTo = (seconds) => {
    console.log(`[YouTube] seekTo called: ${seconds}s`);
    player?.seekTo(seconds, true);
  };

  const loadVideoById = (videoId) => {
    console.log(`[YouTube] loadVideoById called: ${videoId}`);
    player?.loadVideoById(videoId);
  };

  return {
    player,
    isReady,
    apiReady: apiReadyRef.current,
    createPlayer,
    getPlayerState,
    playVideo,
    pauseVideo,
    seekTo,
    loadVideoById,
  };
};

export default useYouTube;
