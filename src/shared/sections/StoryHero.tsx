import Image from "next/image";
import Link from "next/link";
import type { StoryDetail } from "@/db/queries";
import { videoPath } from "@/lib/video-seo";
import { LinkButton } from "@/shared/ui/LinkButton";
import { TagPill } from "@/shared/ui/TagPill";
import { VideoEmbed } from "@/shared/ui/VideoEmbed";

const publishedFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

export function StoryHero({ story }: { story: StoryDetail }) {
  const bandHref = `/bands/${story.band.slug}/`;

  return (
    <section className="space-y-4">
      <div className="bg-white p-4 sm:p-6">
        <h1 translate="no" className="notranslate text-3xl font-bold text-title sm:text-4xl">{story.title}</h1>
        <p className="mt-1 text-lg font-semibold">
          <Link href={bandHref} translate="no" className="notranslate hover:underline">
            {story.band.name}
          </Link>
        </p>
        {story.subtitle && <p className="mt-3 text-neutral-700">{story.subtitle}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-500">
          <time dateTime={story.publishedAt.toISOString()}>
            {publishedFormatter.format(story.publishedAt)}
          </time>
          <span className="flex items-center gap-1">
            {story.views}
            <img src="/brand/eye.svg" alt="views" className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <Link href={bandHref} className="shrink-0 bg-black p-2">
            <Image
              src={story.band.logoPath}
              alt={`${story.band.name} logo`}
              width={120}
              height={60}
              translate="no"
              className="notranslate h-14 w-auto object-contain"
            />
          </Link>
          <p translate="no" className="notranslate italic text-neutral-500">
            {story.album}
          </p>
        </div>
      </div>

      <VideoEmbed
        youtubeId={story.youtubeId}
        title={`${story.title} by ${story.band.name}`}
        loading="lazy"
      />

      <div>
        <LinkButton href={videoPath(story)}>View Only Video</LinkButton>
      </div>

      {story.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {story.tags.map((tag) => (
            <li key={tag.slug}>
              <TagPill tag={tag} variant="light" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
