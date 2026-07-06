import { X, Trash2, Download, Calendar, HardDrive, Clock } from 'lucide-react';
import { useState } from 'react';

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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VideoPlayer({ video, onClose, onDelete, getMediaUrl, isAdmin }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative bg-black rounded-t-2xl">
          <video
            src={getMediaUrl(`/api/stream/${video.filename}`)}
            controls
            autoPlay
            className="w-full max-h-[60vh] rounded-t-2xl"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{video.title}</h2>
          {video.description && (
            <p className="text-gray-500 text-sm mb-4">{video.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(video.uploadedAt)}
            </span>
            {video.durationFormatted && video.durationFormatted !== '0:00' && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {video.durationFormatted}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              {formatBytes(video.size)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={getMediaUrl(`/api/download/${video.filename}`)}
              download
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Herunterladen
            </a>

            {!confirmDelete && isAdmin && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Löschen
              </button>
            )}

            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Wirklich löschen?</span>
                <button
                  onClick={() => onDelete(video.id)}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors"
                >
                  Ja, löschen
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
