import Image from "next/image";
import Link from "next/link";
import type { StoryDetail } from "@/db/queries";

const publishedFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function VideoHero({ story }: { story: StoryDetail }) {
  return (
    <header className="text-center">
      <h1 translate="no" className="notranslate text-3xl font-bold text-title sm:text-4xl">{story.title}</h1>
      <h2 className="mt-1 text-lg font-bold">
        <Link
          href={`/bands/${story.band.slug}/`}
          translate="no"
          className="notranslate hover:underline"
        >
          {story.band.name}
        </Link>
      </h2>
      {story.subtitle && <p className="mt-3 text-neutral-700">{story.subtitle}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-600">
        <time dateTime={story.publishedAt.toISOString()}>
          {publishedFormatter.format(story.publishedAt)}
        </time>
        <span className="flex items-center gap-1">
          {story.views}
          <Image src="/brand/eye.svg" alt="views" width={14} height={14} className="h-3.5 w-3.5" />
        </span>
      </div>
    </header>
  );
}
