import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import VideoGrid from './components/VideoGrid.jsx';
import UploadModal from './components/UploadModal.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import EmptyState from './components/EmptyState.jsx';
import { CloudUpload, Film } from 'lucide-react';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos');
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleUpload = async (file, title, description) => {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
      xhr.addEventListener('load', () => {
        setUploadProgress(null);
        if (xhr.status === 201) {
          const newVideo = JSON.parse(xhr.responseText);
          setVideos((prev) => [newVideo, ...prev]);
          resolve();
        } else {
          reject(new Error(xhr.responseText));
        }
      });
      xhr.addEventListener('error', () => {
        setUploadProgress(null);
        reject(new Error('Upload failed'));
      });
      xhr.open('POST', '/api/videos');
      xhr.send(formData);
    });
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setPlayingVideo(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updated } : v)));
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        videoCount={videos.length}
        onUploadClick={() => setUploadOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
                <div className="aspect-video shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-3 w-1/2 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <EmptyState onUpload={() => setUploadOpen(true)} />
        ) : (
          <VideoGrid
            videos={videos}
            onPlay={setPlayingVideo}
            onDelete={handleDelete}
            onEdit={handleUpdate}
          />
        )}
      </main>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUpload={handleUpload}
          progress={uploadProgress}
        />
      )}

      {playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
          onDelete={handleDelete}
        />
      )}

      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Video Cloud
          </span>
          <span>{videos.length} {videos.length === 1 ? 'Video' : 'Videos'}</span>
        </div>
      </footer>
    </div>
  );
}
