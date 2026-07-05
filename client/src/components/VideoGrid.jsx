import VideoCard from './VideoCard.jsx';

export default function VideoGrid({ videos, onPlay, onDelete, onEdit, getMediaUrl, isAdmin }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onPlay={onPlay}
          onDelete={onDelete}
          onEdit={onEdit}
          getMediaUrl={getMediaUrl}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
