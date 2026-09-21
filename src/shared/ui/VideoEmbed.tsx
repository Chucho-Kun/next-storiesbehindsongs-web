export function VideoEmbed({
  youtubeId,
  title,
  loading = "lazy",
}: {
  youtubeId: string;
  title: string;
  loading?: "eager" | "lazy";
}) {
  return (
    <div className="relative aspect-video w-full bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={title}
        loading={loading}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
