import { useCallback } from 'react';
import {
  extractVideoId,
  extractPlaylistId,
  getVideoDetails,
  getPlaylistVideos,
  formatDuration,
  isValidYouTubeUrl,
  getThumbnailUrl
} from '../utils/youtube';

const useYouTube = () => {
  const fetchVideoDetails = useCallback(async (url) => {
    if (!isValidYouTubeUrl(url)) return null;
    const videoId = extractVideoId(url);
    if (!videoId) return null;
    const details = await getVideoDetails(videoId);
    return details;
  }, []);

  const fetchPlaylistVideos = useCallback(async (url) => {
    if (!isValidYouTubeUrl(url)) return [];
    const playlistId = extractPlaylistId(url);
    if (!playlistId) return [];
    const videos = await getPlaylistVideos(playlistId);
    return videos;
  }, []);

  return {
    extractVideoId,
    extractPlaylistId,
    getVideoDetails,
    getPlaylistVideos,
    formatDuration,
    isValidYouTubeUrl,
    getThumbnailUrl,
    fetchVideoDetails,
    fetchPlaylistVideos
  };
};

export default useYouTube;
