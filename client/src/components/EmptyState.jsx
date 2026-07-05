import { CloudUpload, Film } from 'lucide-react';

export default function EmptyState({ onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 blur-3xl bg-brand-600/20 rounded-full" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
          <Film className="w-10 h-10 text-brand-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Noch keine Videos</h2>
      <p className="text-gray-400 max-w-md mb-8">
        {onUpload
          ? 'Lade deine ersten Videoprojekte hoch und teile sie mit deinen Kunden. Einfach per Drag & Drop oder Klick auf Upload.'
          : 'Es wurden noch keine Videos hochgeladen. Schade später wieder vorbei.'
        }
      </p>
      {onUpload && (
        <button
          onClick={onUpload}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white font-medium transition-all shadow-lg shadow-brand-600/20 hover:shadow-brand-500/30"
        >
          <CloudUpload className="w-5 h-5" />
          Erstes Video hochladen
        </button>
      )}
    </div>
  );
}
