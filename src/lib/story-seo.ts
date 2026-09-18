import type { Metadata } from "next";
import type { StoryDetail } from "@/db/queries";
import { buildFaqEntries } from "@/shared/sections/StoryFaq";

export const SITE_URL = "https://storiesbehindsongs.com";

export function storyPath(story: Pick<StoryDetail, "slug" | "band">): string {
  return `/read/${story.band.slug}/${story.slug}/`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function storyDescription(story: StoryDetail): string {
  const text = story.subtitle ?? story.faqs?.meaning ?? `The story behind ${story.title} by ${story.band.name}.`;
  return truncate(text, 160);
}

export function buildStoryMetadata(story: StoryDetail): Metadata {
  const title = `${story.title} by ${story.band.name}`;
  const description = storyDescription(story);
  const path = storyPath(story);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Stories Behind Songs",
      type: "article",
      publishedTime: story.publishedAt.toISOString(),
      images: [{ url: story.coverPath, alt: `${story.title} by ${story.band.name}` }],
    },
  };
}

export function buildBreadcrumbJsonLd(story: StoryDetail) {
  const items = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: story.band.name, url: `${SITE_URL}/bands/${story.band.slug}/` },
    { name: story.title, url: `${SITE_URL}${storyPath(story)}` },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildBlogPostingJsonLd(story: StoryDetail) {
  const published = story.publishedAt.toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: story.title,
    description: storyDescription(story),
    image: `${SITE_URL}${story.coverPath}`,
    datePublished: published,
    // The DB has no separate "updated" date, so it equals the publication date.
    dateModified: published,
    mainEntityOfPage: `${SITE_URL}${storyPath(story)}`,
  };
}

/** The 4th question answers with the normalized `stories.lyrics`, never the raw `faqs.lyrics`. */
export function buildFaqJsonLd(story: StoryDetail) {
  const entries = buildFaqEntries(story).flatMap((entry) => {
    if (!entry.href) return [entry];
    return story.lyrics ? [{ ...entry, answer: story.lyrics }] : [];
  });

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: { "@type": "Answer", text: entry.answer },
    })),
  };
}

/** Serializes JSON-LD for an inline script; `<` is escaped so DB text can't close the tag. */
export function jsonLdString(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
