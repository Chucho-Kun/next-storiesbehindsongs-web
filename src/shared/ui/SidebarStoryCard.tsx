import Image from "next/image";
import Link from "next/link";
import type { StoryCard as StoryCardData } from "@/db/queries";

/** Vertical story card used by the "Most Popular Stories" sidebar on the story page. */
export function SidebarStoryCard({ story }: { story: StoryCardData }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0">
          <Image
            src={story.band.logoPath}
            alt={story.band.name}
            fill
            sizes="56px"
            translate="no"
            className="notranslate object-contain"
          />
        </div>
        <div className="min-w-0">
          <Link
            href={`/read/${story.band.slug}/${story.slug}/`}
            translate="no"
            className="notranslate text-lg font-bold text-title hover:underline"
          >
            {story.title}
          </Link>
          <div className="mt-1 flex items-center justify-between gap-2 text-sm text-neutral-600">
            <span translate="no" className="notranslate">
              {story.band.name}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              {story.views}
              <img src="/brand/eye.svg" alt="" className="h-3.5 w-3.5" />
            </span>
          </div>
          <p translate="no" className="notranslate text-sm text-neutral-600">
            {story.album}
          </p>
        </div>
      </div>

      {story.subtitle && <p className="mt-3 text-sm text-neutral-900">{story.subtitle}</p>}

      <div className="relative mt-3 aspect-[16/9] w-full overflow-hidden">
        <Image
          src={story.coverPath}
          alt={story.title}
          fill
          sizes="(min-width: 768px) 25vw, 90vw"
          translate="no"
          className="notranslate object-cover"
        />
      </div>
    </div>
  );
}
