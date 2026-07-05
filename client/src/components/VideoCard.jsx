import { Play, Clock, MoreVertical, Trash2, Pencil, HardDrive, Users } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function VideoCard({ video, onPlay, onDelete, onEdit, getMediaUrl, isAdmin }) {
  const { authFetch } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [assignedTo, setAssignedTo] = useState(video.assignedTo || []);
  const [users, setUsers] = useState([]);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSaveEdit = () => {
    onEdit(video.id, { title, description, assignedTo });
    setEditOpen(false);
  };

  return (
    <div className="group relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all hover:shadow-2xl hover:shadow-black/40 animate-fade-in">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-gray-800 cursor-pointer overflow-hidden"
        onClick={() => onPlay(video)}
      >
        <img
          src={getMediaUrl(video.thumbnailUrl)}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
            const fallback = document.createElement('div');
            fallback.className = 'text-gray-600';
            fallback.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>';
            e.target.parentElement.appendChild(fallback);
          }}
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
            <Play className="w-6 h-6 text-gray-900 ml-0.5" fill="currentColor" />
          </div>
        </div>
        {/* Duration badge */}
        {video.durationFormatted && video.durationFormatted !== '0:00' && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {video.durationFormatted}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 flex-1">
            {video.title}
          </h3>
            {isAdmin && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-10 w-40 rounded-lg bg-gray-800 border border-gray-700 shadow-xl py-1">
                    <button
                      onClick={() => {
                        setEditOpen(true);
                        setMenuOpen(false);
                        authFetch('/api/users').then(res => res.json()).then(setUsers).catch(() => {});
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => { onDelete(video.id); setMenuOpen(false); }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Löschen
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
        {video.description && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{video.description}</p>
        )}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span>{formatDate(video.uploadedAt)}</span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatBytes(video.size)}
          </span>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-800 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-4">Video bearbeiten</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:border-brand-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Sichtbar für Nutzer
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin rounded-lg bg-gray-800 border border-gray-700 p-3">
                  {users.filter(u => u.role !== 'admin').length === 0 && (
                    <p className="text-xs text-gray-500">Keine Nutzer vorhanden.</p>
                  )}
                  {users.filter(u => u.role !== 'admin').map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={assignedTo.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setAssignedTo([...assignedTo, u.id]);
                          else setAssignedTo(assignedTo.filter(id => id !== u.id));
                        }}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-sm text-gray-300">{u.name} <span className="text-gray-500">@{u.username}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium transition-colors"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
