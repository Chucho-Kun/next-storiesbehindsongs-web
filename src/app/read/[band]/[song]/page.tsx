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
import { PopularStoriesSidebar } from "@/shared/sections/PopularStoriesSidebar";
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
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: story.band.name, href: `/bands/${story.band.slug}/`, noTranslate: true },
            { label: story.title, noTranslate: true },
          ]}
        />
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-6 md:col-span-2">
            <StoryHero story={story} />
            <YoutubeBanner />
            <StoryBody html={story.bodyHtml} />
            <StoryLyrics lyrics={story.lyrics} />
            <StoryFaq story={story} />
          </div>
          <div>
            <PopularStoriesSidebar excludeId={story.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
