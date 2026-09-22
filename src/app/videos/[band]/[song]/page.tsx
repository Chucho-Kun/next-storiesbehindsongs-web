import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAllStorySlugs, getStoryBySlugs } from "@/db/queries";
import { jsonLdString, storyPath } from "@/lib/story-seo";
import {
  buildVideoBreadcrumbJsonLd,
  buildVideoMetadata,
  buildVideoObjectJsonLd,
} from "@/lib/video-seo";
import { VideoHero } from "@/shared/sections/VideoHero";
import { Breadcrumb } from "@/shared/ui/Breadcrumb";
import { LinkButton } from "@/shared/ui/LinkButton";
import { VideoEmbed } from "@/shared/ui/VideoEmbed";

type Params = { band: string; song: string };

const loadStory = cache(getStoryBySlugs);

export async function generateStaticParams(): Promise<Params[]> {
  return getAllStorySlugs();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { band, song } = await params;
  const story = await loadStory(band, song);
  if (!story) notFound();

  return buildVideoMetadata(story);
}

export default async function VideoPage({ params }: { params: Promise<Params> }) {
  const { band, song } = await params;
  const story = await loadStory(band, song);
  if (!story) notFound();

  const jsonLd = [buildVideoBreadcrumbJsonLd(story), buildVideoObjectJsonLd(story)];

  return (
    <div className="bg-[#efefef] text-neutral-900">
      {jsonLd.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
        />
      ))}
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-4 sm:px-8">
        <VideoEmbed
          youtubeId={story.youtubeId}
          title={`${story.title} by ${story.band.name}`}
          loading="eager"
        />
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: story.band.name, href: `/bands/${story.band.slug}/`, noTranslate: true },
            { label: story.title, noTranslate: true },
          ]}
        />
        <VideoHero story={story} />
        <div className="flex justify-center pb-4">
          <LinkButton href={storyPath(story)}>Read Full Article</LinkButton>
        </div>
      </div>
    </div>
  );
}
