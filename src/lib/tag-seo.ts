import type { Metadata } from "next";
import type { TagDetail } from "@/db/queries";
import { SITE_URL, truncate } from "@/lib/story-seo";

export const TAGS_INDEX_PATH = "/tags/";

export function tagPath(tag: Pick<TagDetail, "slug">): string {
  return `/tags/${tag.slug}/`;
}

function tagDescription(tag: TagDetail): string {
  const count = tag.storyCount === 1 ? "1 story" : `${tag.storyCount} stories`;
  return truncate(`${count} behind songs tagged "${tag.name}". Discover the stories behind the songs.`, 160);
}

export function buildTagMetadata(tag: TagDetail): Metadata {
  const title = `Songs Tagged "${tag.name}"`;
  const description = tagDescription(tag);
  const path = tagPath(tag);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: "Stories Behind Songs", type: "website" },
  };
}

export function buildTagsIndexMetadata(tagCount: number): Metadata {
  const title = "Song Story Tags";
  const description = `Browse all ${tagCount} tags and find the stories behind the songs you love.`;

  return {
    title,
    description,
    alternates: { canonical: TAGS_INDEX_PATH },
    openGraph: {
      title,
      description,
      url: TAGS_INDEX_PATH,
      siteName: "Stories Behind Songs",
      type: "website",
    },
  };
}

function breadcrumbList(items: { name: string; url: string }[]) {
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

export function buildTagBreadcrumbJsonLd(tag: TagDetail) {
  return breadcrumbList([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tags", url: `${SITE_URL}${TAGS_INDEX_PATH}` },
    { name: tag.name, url: `${SITE_URL}${tagPath(tag)}` },
  ]);
}

export function buildTagsIndexBreadcrumbJsonLd() {
  return breadcrumbList([
    { name: "Home", url: `${SITE_URL}/` },
    { name: "Tags", url: `${SITE_URL}${TAGS_INDEX_PATH}` },
  ]);
}

export function buildTagCollectionJsonLd(tag: TagDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Songs Tagged "${tag.name}"`,
    url: `${SITE_URL}${tagPath(tag)}`,
    description: tagDescription(tag),
  };
}
