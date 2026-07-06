import { useState, useRef, useCallback, useEffect } from 'react';
import { CloudUpload, X, Film, Loader2, CheckCircle, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function UploadModal({ onClose, onUpload, progress }) {
  const { authFetch } = useAuth();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    authFetch('/api/users').then(res => res.json()).then(setUsers).catch(() => {});
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const valid = /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(droppedFile.name);
      if (valid) {
        setFile(droppedFile);
        if (!title) setTitle(droppedFile.name.replace(/\.[^.]+$/, ''));
        setError('');
      } else {
        setError('Nicht unterstütztes Format. Erlaubt: mp4, mov, avi, mkv, webm, m4v');
      }
    }
  }, [title]);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ''));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await onUpload(file, title, description, assignedTo);
      onClose();
    } catch (err) {
      setError('Upload fehlgeschlagen. Bitte versuche es erneut.');
      setUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Video hochladen</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Drop zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/5'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.mov,.avi,.mkv,.webm,.m4v"
                onChange={handleFileSelect}
                className="hidden"
              />
              <CloudUpload className="w-12 h-12 text-brand-500 mx-auto mb-3" />
              <p className="text-gray-900 font-medium">Video hierher ziehen</p>
              <p className="text-sm text-gray-500 mt-1">oder klicken zum Auswählen</p>
              <p className="text-xs text-gray-400 mt-3">
                MP4, MOV, AVI, MKV, WebM — max. 10 GB
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-500/10">
                  <Film className="w-6 h-6 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                </div>
                {!uploading && (
                  <button
                    type="button"
                    onClick={() => { setFile(null); setTitle(''); }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {uploading && progress !== null && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      {progress < 100 ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                      {progress < 100 ? 'Wird hochgeladen…' : 'Verarbeitung…'}
                    </span>
                    <span className="text-gray-900 font-medium">{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          {file && !uploading && (
            <>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Videotitel"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Beschreibung (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kurzbeschreibung des Videos…"
                  rows="3"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Sichtbar für Nutzer
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin rounded-lg bg-gray-50 border border-gray-300 p-3">
                  {users.filter(u => u.role !== 'admin').length === 0 && (
                    <p className="text-xs text-gray-500">Keine Nutzer vorhanden. Lege zuerst Nutzer an.</p>
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
                      <span className="text-sm text-gray-700">{u.name} <span className="text-gray-400">@{u.username}</span></span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Keine Auswahl = nur für Admins sichtbar</p>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          {file && !uploading && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white text-sm font-medium transition-all shadow-lg shadow-brand-600/20"
              >
                <CloudUpload className="w-4 h-4" />
                Hochladen
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
