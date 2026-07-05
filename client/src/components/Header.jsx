import { CloudUpload, Video } from 'lucide-react';

export default function Header({ videoCount, onUploadClick }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Video Cloud</h1>
              <p className="text-xs text-gray-500">Professionelle Video-Ablage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center text-sm text-gray-400">
              {videoCount} {videoCount === 1 ? 'Video' : 'Videos'}
            </span>
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium text-sm transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30"
            >
              <CloudUpload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
