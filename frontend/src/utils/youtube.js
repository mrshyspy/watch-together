import axios from 'axios';

const API_KEY = import.meta.env.YOUTUBE_API_KEY; // or however you store it

export async function isEmbeddable(videoId) {
  try {
    const res = await axios.get(
      `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=AIzaSyDZlhU9aNYmUfBklc86gYCZuMQQU4pAWr4`
    );
    return res.data.items[0]?.status.embeddable === true;
  } catch (error) {
    console.error("[YouTube] Embed check failed:", error);
    return false;
  }
}


const SERVER_URL = import.meta.env.VITE_REACT_APP_SERVER_URL || 'http://localhost:5001';
// Extract video ID from YouTube URL
export const extractVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Extract playlist ID from YouTube URL
export const extractPlaylistId = (url) => {
  const regex = /[?&]list=([^#\&\?]*)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Get video details from YouTube API
export const getVideoDetails = async (videoId) => {
  try {
    const response = await axios.get(`${SERVER_URL}/api/youtube/video/${videoId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
};

// Get playlist videos from YouTube API
export const getPlaylistVideos = async (playlistId) => {
  try {
    const response = await axios.get(`${SERVER_URL}/api/youtube/playlist/${playlistId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching playlist videos:', error);
    throw error;
  }
};

// Format duration from YouTube API format (PT4M13S) to readable format
export const formatDuration = (duration) => {
  if (!duration) return '0:00';
  
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');
  
  if (hours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  } else {
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
  }
};

// Validate YouTube URL
export const isValidYouTubeUrl = (url) => {
  const regex = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return regex.test(url);
};

// Get thumbnail URL for a video
export const getThumbnailUrl = (videoId, quality = 'mqdefault') => {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};