import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAllTagSlugs, getPopularStories, getRecentStories, getTagBySlug } from "@/db/queries";
import { jsonLdString } from "@/lib/story-seo";
import {
  buildTagBreadcrumbJsonLd,
  buildTagCollectionJsonLd,
  buildTagMetadata,
} from "@/lib/tag-seo";
import { RelatedTags } from "@/shared/sections/RelatedTags";
import { StoryGrid } from "@/shared/sections/StoryGrid";
import { Breadcrumb } from "@/shared/ui/Breadcrumb";

type Params = { tag: string };

const PAGE_SIZE = 20;

const loadTag = cache(getTagBySlug);

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllTagSlugs();
  return slugs.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { tag: tagSlug } = await params;
  const tag = await loadTag(tagSlug);
  if (!tag || tag.storyCount === 0) notFound();

  return buildTagMetadata(tag);
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { tag: tagSlug } = await params;
  const tag = await loadTag(tagSlug);
  if (!tag || tag.storyCount === 0) notFound();

  const [recentStories, popularStories] = await Promise.all([
    getRecentStories(PAGE_SIZE, 0, undefined, tag.slug),
    getPopularStories(PAGE_SIZE, 0, undefined, undefined, tag.slug),
  ]);

  const jsonLd = [buildTagBreadcrumbJsonLd(tag), buildTagCollectionJsonLd(tag)];

  return (
    <div className="bg-background">
      {jsonLd.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
        />
      ))}
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-8">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Tags", href: "/tags/" }, { label: tag.name }]}
        />
        <h1 className="mt-6 text-3xl font-bold capitalize text-title sm:text-4xl">{tag.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {tag.storyCount === 1 ? "1 story" : `${tag.storyCount} stories`}
        </p>
      </div>
      <RelatedTags tagSlug={tag.slug} />
      <StoryGrid
        title={`Recent Articles: ${tag.name}`}
        baseUrl={`/api/stories/?section=recent&tag=${tag.slug}`}
        initialStories={recentStories}
      />
      <StoryGrid
        title={`Most Popular Songs: ${tag.name}`}
        baseUrl={`/api/stories/?section=popular&tag=${tag.slug}`}
        initialStories={popularStories}
      />
    </div>
  );
}
