import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAllStorySlugs, getStoryBySlugs } from "@/db/queries";
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildStoryMetadata,
  jsonLdString,
} from "@/lib/story-seo";
import { MostPopularStories } from "@/shared/sections/MostPopularStories";
import { RelatedSongs } from "@/shared/sections/RelatedSongs";
import { StoryBody } from "@/shared/sections/StoryBody";
import { StoryFaq } from "@/shared/sections/StoryFaq";
import { StoryHero } from "@/shared/sections/StoryHero";
import { StoryLyrics } from "@/shared/sections/StoryLyrics";
import { YoutubeBanner } from "@/shared/sections/YoutubeBanner";
import { Breadcrumb } from "@/shared/ui/Breadcrumb";

type Params = { band: string; song: string };

const loadStory = cache(getStoryBySlugs);

export async function generateStaticParams(): Promise<Params[]> {
  return getAllStorySlugs();
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { band, song } = await params;
  const story = await loadStory(band, song);
  if (!story) notFound();

  return buildStoryMetadata(story);
}

export default async function StoryPage({ params }: { params: Promise<Params> }) {
  const { band, song } = await params;
  const story = await loadStory(band, song);
  if (!story) notFound();

  const jsonLd = [buildBreadcrumbJsonLd(story), buildBlogPostingJsonLd(story), buildFaqJsonLd(story)];

  return (
    <div className="bg-[#efefef] text-neutral-900">
      {jsonLd.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
        />
      ))}
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-4 sm:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: story.band.name, href: `/bands/${story.band.slug}/`, noTranslate: true },
            { label: story.title, noTranslate: true },
          ]}
        />
        <StoryHero story={story} />
        <YoutubeBanner />
        <StoryBody html={story.bodyHtml} />
        <StoryLyrics lyrics={story.lyrics} />
        <StoryFaq story={story} />
        <MostPopularStories excludeId={story.id} />
        <RelatedSongs storyId={story.id} tagSlugs={story.tags.map((tag) => tag.slug)} />
      </div>
    </div>
  );
}
