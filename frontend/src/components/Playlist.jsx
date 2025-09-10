import React, { useState } from 'react';
import { extractVideoId, getVideoDetails, isValidYouTubeUrl } from '../utils/youtube';

const Playlist = ({ playlist, currentVideo, userRole, addVideo, removeVideo }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddVideo = async () => {
    setError('');
    if (!isValidYouTubeUrl(videoUrl)) {
      setError('Invalid YouTube URL');
      return;
    }
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      setError('Could not extract video ID');
      return;
    }
    setLoading(true);
    try {
      const details = await getVideoDetails(videoId);
      addVideo({
        videoId: details.id,
        title: details.title,
        thumbnail: details.thumbnail,
        duration: details.duration
      });
      setVideoUrl('');
    } catch (e) {
      setError('Failed to fetch video details');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-2">Playlist</h3>
      <ul className="mb-2">
        {playlist.map(video => (
          <li key={video.id} className={`flex items-center py-2 px-2 rounded ${currentVideo?.id === video.id ? 'bg-purple-900' : ''}`}>
            <img src={video.thumbnail} alt="thumb" className="w-16 h-9 mr-2 rounded" />
            <div className="flex-1">
              <div className="font-medium text-white">{video.title}</div>
              <div className="text-xs text-gray-400">Added by: {video.addedBy}</div>
            </div>
            {userRole === 'cohost' && (
              <button onClick={() => removeVideo(video.id)} className="ml-2 text-red-400 hover:text-red-600">Remove</button>
            )}
          </li>
        ))}
      </ul>
      {userRole === 'cohost' && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="flex-1 px-2 py-1 rounded bg-gray-700 text-white"
            placeholder="Paste YouTube URL"
            value={videoUrl}
            onChange={e => setVideoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddVideo()}
            disabled={loading}
          />
          <button
            onClick={handleAddVideo}
            disabled={loading || !videoUrl.trim()}
            className="bg-green-600 px-3 py-1 rounded text-white font-semibold hover:bg-green-700"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      )}
      {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
    </div>
  );
};

export default Playlist;
