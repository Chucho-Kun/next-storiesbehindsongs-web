import type { BandAlbum } from "@/db/queries";
import { AlbumCover } from "@/shared/ui/AlbumCover";

export function AlbumShelf({ albums }: { albums: BandAlbum[] }) {
  if (albums.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h2 className="mb-4 text-2xl font-bold text-title">Listen Full Album</h2>
      <ul className="flex snap-x gap-4 overflow-x-auto pb-4">
        {albums.map((album) => {
          const year = album.releaseDate.slice(0, 4);
          return (
            <li key={album.id} className="w-56 shrink-0 snap-start">
              <a
                href={album.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Listen to ${album.name} (${year}) full album, opens in a new tab`}
                className="group block"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-900">
                  <AlbumCover src={album.coverPath} name={album.name} />
                </div>
                <p className="mt-2 text-center text-sm font-bold group-hover:underline">
                  {album.name}
                </p>
                <p className="text-center text-sm text-muted">{year}</p>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
