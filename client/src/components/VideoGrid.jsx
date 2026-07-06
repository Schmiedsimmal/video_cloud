import { useState, useMemo } from 'react';
import VideoCard from './VideoCard.jsx';
import { Search, ArrowUpDown, Trash2, X, CheckSquare, Square } from 'lucide-react';

export default function VideoGrid({ videos, onPlay, onDelete, onEdit, onBulkDelete, getMediaUrl, isAdmin }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    let result = videos;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.title.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
      );
    }
    const sorted = [...result];
    switch (sortBy) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'size':
        sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
        break;
      default:
        sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    }
    return sorted;
  }, [videos, search, sortBy]);

  const toggleSelect = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map((v) => v.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
    setSelectMode(false);
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} Video(s) wirklich löschen?`)) return;
    await onBulkDelete(ids);
    clearSelection();
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Videos durchsuchen…"
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>

        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:border-brand-500 focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
            <option value="title">Titel A-Z</option>
            <option value="size">Größe</option>
          </select>
        </div>

        {isAdmin && videos.length > 0 && (
          <button
            onClick={() => selectMode ? clearSelection() : setSelectMode(true)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectMode
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:text-gray-900'
            }`}
          >
            {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            Auswählen
          </button>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectMode && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-white border border-gray-200">
          <span className="text-sm text-gray-400">
            {selected.size} ausgewählt
          </span>
          <button
            onClick={selectAll}
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Alle auswählen
          </button>
          {selected.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </button>
          )}
          <button
            onClick={clearSelection}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">Keine Videos gefunden.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onPlay={onPlay}
              onDelete={onDelete}
              onEdit={onEdit}
              getMediaUrl={getMediaUrl}
              isAdmin={isAdmin}
              selectMode={selectMode}
              isSelected={selected.has(video.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
