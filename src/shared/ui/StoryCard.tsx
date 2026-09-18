import Image from "next/image";
import Link from "next/link";
import type { StoryCard as StoryCardData } from "@/db/queries";

export function StoryCard({ story }: { story: StoryCardData }) {
  return (
    <Link href={`/read/${story.band.slug}/${story.slug}/`} className="block bg-white">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={story.coverPath}
          alt={story.title}
          fill
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        <span className="absolute right-2 top-2 bg-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {story.band.name}
        </span>
      </div>
      <div className="space-y-1 p-3">
        <h3 className="text-lg font-bold text-title">{story.title}</h3>
        <div className="flex items-center justify-between gap-2">
          <p className="italic text-neutral-500">{story.album}</p>
          <span className="flex shrink-0 items-center gap-1 text-sm text-neutral-500">
            {story.views}
            <img src="/brand/eye.svg" alt="" className="h-3.5 w-3.5" />
          </span>
        </div>
        {story.subtitle && (
          <p className="line-clamp-3 text-sm text-neutral-700">{story.subtitle}</p>
        )}
      </div>
    </Link>
  );
}
