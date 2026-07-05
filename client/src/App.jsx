import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import Header from './components/Header.jsx';
import VideoGrid from './components/VideoGrid.jsx';
import UploadModal from './components/UploadModal.jsx';
import VideoPlayer from './components/VideoPlayer.jsx';
import EmptyState from './components/EmptyState.jsx';
import LoginPage from './components/LoginPage.jsx';
import UserManagement from './components/UserManagement.jsx';
import ChangePasswordModal from './components/ChangePasswordModal.jsx';
import { Film, Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, authFetch, getMediaUrl, logout, isAdmin } = useAuth();
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);

  const fetchVideos = useCallback(async () => {
    try {
      const res = await authFetch('/api/videos');
      const data = await res.json();
      setVideos(data);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setVideoLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (user) fetchVideos();
  }, [user, fetchVideos]);

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
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('vc_token')}`);
      xhr.send(formData);
    });
  };

  const handleDelete = async (id) => {
    try {
      await authFetch(`/api/videos/${id}`, { method: 'DELETE' });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      setPlayingVideo(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      const res = await authFetch(`/api/videos/${id}`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        user={user}
        videoCount={videos.length}
        isAdmin={isAdmin}
        onUploadClick={() => setUploadOpen(true)}
        onUserMgmtClick={() => setUserMgmtOpen(true)}
        onLogout={logout}
        onChangePassword={() => setPasswordChangeOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {videoLoading ? (
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
          <EmptyState onUpload={isAdmin ? () => setUploadOpen(true) : null} />
        ) : (
          <VideoGrid
            videos={videos}
            onPlay={setPlayingVideo}
            onDelete={handleDelete}
            onEdit={handleUpdate}
            getMediaUrl={getMediaUrl}
            isAdmin={isAdmin}
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
          getMediaUrl={getMediaUrl}
          isAdmin={isAdmin}
        />
      )}

      {userMgmtOpen && (
        <UserManagement onClose={() => setUserMgmtOpen(false)} />
      )}

      {passwordChangeOpen && (
        <ChangePasswordModal onClose={() => setPasswordChangeOpen(false)} />
      )}

      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Video Cloud — SW Vision
          </span>
          <span>{videos.length} {videos.length === 1 ? 'Video' : 'Videos'}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
