import React, { useState } from 'react';
import { extractVideoId, extractPlaylistId, getVideoDetails, getPlaylistVideos, isValidYouTubeUrl, isEmbeddable } from '../utils/youtube';

const Playlist = ({ 
  playlist, 
  currentVideo, 
  userRole, 
  onAddVideo, 
  onRemoveVideo, 
  onNextVideo,
   
}) => {
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  
// console.log("Current video:", currentVideo);
  // console.log("Video state:", videoState);
    // console.log("Video id:", currentVideo?.id);

    const formatDuration = (isoDuration) => {
  if (!isoDuration) return '';

  // already formatted (mm:ss or hh:mm:ss)
  if (!isoDuration.startsWith('PT')) return isoDuration;

  const match = isoDuration.match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  const hours = parseInt(match?.[1] || 0, 10);
  const minutes = parseInt(match?.[2] || 0, 10);
  const seconds = parseInt(match?.[3] || 0, 10);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
  const handleAddVideo = async () => {
    if (!newVideoUrl.trim()) return;

    if (!isValidYouTubeUrl(newVideoUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const videoId = extractVideoId(newVideoUrl);
      if (!videoId) {
        throw new Error('Could not extract video ID from URL');
      }

      const videoDetails = await getVideoDetails(videoId);
      onAddVideo({
        videoId: videoDetails.id,
        title: videoDetails.title,
        thumbnail: videoDetails.thumbnail,
        duration: videoDetails.duration
      });

      setNewVideoUrl('');
    } catch (err) {
      setError('Failed to add video. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  

  const handleImportPlaylist = async () => {
    if (!newVideoUrl.trim()) return;

    const playlistId = extractPlaylistId(newVideoUrl);
    if (!playlistId) {
      setError('Please enter a valid YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const videos = await getPlaylistVideos(playlistId);
      
      // Add each video to the playlist
      for (const video of videos) {
        const videoDetails = await getVideoDetails(video.id);
        onAddVideo({
          videoId: videoDetails.id,
          title: videoDetails.title,
          thumbnail: videoDetails.thumbnail,
          duration: videoDetails.duration
        });
      }

      setNewVideoUrl('');
    } catch (err) {
      setError('Failed to import playlist. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Playlist</h3>
        <span className="text-sm text-gray-400">
          {playlist.length} video{playlist.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Add video form */}
      <div className="mb-4 space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Paste YouTube video or playlist URL..."
            value={newVideoUrl}
            onChange={(e) => setNewVideoUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddVideo()}
          />
          <button
            onClick={handleAddVideo}
            disabled={isLoading || !newVideoUrl.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Add'
            )}
          </button>
        </div>

        {extractPlaylistId(newVideoUrl) && (
          <button
            onClick={handleImportPlaylist}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 text-sm font-medium"
          >
            Import Entire Playlist
          </button>
        )}

        {error && (
          <p className="text-red-400 text-xs">{error}</p>
        )}
      </div>

      {/* Controls for cohosts */}
      {userRole === 'cohost' && currentVideo && (
        <div className="mb-4">
          <button
            onClick={onNextVideo}
            className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center space-x-2"
          >
            <span>⏭️</span>
            <span>Next Video</span>
          </button>
        </div>
      )}

      {/* Playlist items */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {playlist.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">🎵</div>
            <p className="text-sm">No videos in playlist yet</p>
            <p className="text-xs mt-1">Add a YouTube video to get started!</p>
          </div>
        ) : (
          playlist.map((video, index) => (
            <div
              key={video.id}
              className={`p-3 rounded-lg border transition-all duration-200 ${
                currentVideo?.id === video.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-600 bg-gray-700/50 hover:bg-gray-600/50'
              }`}
            >
              <div className="flex space-x-3">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-16 h-12 object-cover rounded flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate">
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      by {video.addedBy}
                    </span>
                    {video.duration && (
  <span className="text-xs text-gray-400">
    {formatDuration(video.duration)}
  </span>
)}

                  </div>
                  {currentVideo?.id === video.id && (
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-xs text-purple-400 font-medium">Now Playing</span>
                    </div>
                  )}
                </div>
                {userRole === 'cohost' && (
                  <button
                    onClick={() => onRemoveVideo(video.id)}
                    className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
                    title="Remove video"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Playlist;
