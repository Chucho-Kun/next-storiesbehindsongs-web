import type { Metadata } from "next";
import type { StoryDetail } from "@/db/queries";
import { SITE_URL, storyDescription } from "@/lib/story-seo";

export function videoPath(story: Pick<StoryDetail, "slug" | "band">): string {
  return `/videos/${story.band.slug}/${story.slug}/`;
}

const embedUrl = (youtubeId: string) => `https://www.youtube.com/embed/${youtubeId}`;

export function buildVideoMetadata(story: StoryDetail): Metadata {
  const title = `${story.title} by ${story.band.name} (Video)`;
  const description = storyDescription(story);
  const path = videoPath(story);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Stories Behind Songs",
      type: "video.other",
      videos: [{ url: embedUrl(story.youtubeId) }],
      images: [{ url: story.coverPath, alt: `${story.title} by ${story.band.name}` }],
    },
  };
}

export function buildVideoBreadcrumbJsonLd(story: StoryDetail) {
  const items = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: story.band.name, url: `${SITE_URL}/bands/${story.band.slug}/` },
    { name: story.title, url: `${SITE_URL}${videoPath(story)}` },
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

/** No `duration`: the DB does not store it (see SPEC 05, out of scope). */
export function buildVideoObjectJsonLd(story: StoryDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${story.title} - ${story.band.name}`,
    description: storyDescription(story),
    thumbnailUrl: [
      `https://i.ytimg.com/vi/${story.youtubeId}/hqdefault.jpg`,
      `${SITE_URL}${story.coverPath}`,
    ],
    uploadDate: story.publishedAt.toISOString(),
    contentUrl: `https://www.youtube.com/watch?v=${story.youtubeId}`,
    embedUrl: embedUrl(story.youtubeId),
  };
}
