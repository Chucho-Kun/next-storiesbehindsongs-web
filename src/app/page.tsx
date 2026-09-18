import type { Metadata } from "next";
import { getPopularStories, getRecentStories } from "@/db/queries";
import { PopularBands } from "@/shared/sections/PopularBands";
import { PopularTags } from "@/shared/sections/PopularTags";
import { StoryGrid } from "@/shared/sections/StoryGrid";
import { YoutubeBanner } from "@/shared/sections/YoutubeBanner";

const description =
  "Discover the true stories behind popular songs: who wrote them, why, and what inspired the lyrics.";

export const metadata: Metadata = {
  title: { absolute: "Stories Behind Songs" },
  description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Stories Behind Songs",
    description,
    url: "/",
    siteName: "Stories Behind Songs",
    type: "website",
    images: [
      {
        url: "/brand/youtube-banner.webp",
        width: 1333,
        height: 368,
        alt: "Stories Behind Songs",
      },
    ],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Stories Behind Songs",
  url: "https://storiesbehindsongs.com/",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://storiesbehindsongs.com/search/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function Home() {
  const [recentStories, popularStories] = await Promise.all([
    getRecentStories(20, 0),
    getPopularStories(20, 0),
  ]);

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <YoutubeBanner />
      <PopularTags />
      <PopularBands />
      <StoryGrid
        title="Recent Articles"
        baseUrl="/api/stories/?section=recent"
        initialStories={recentStories}
      />
      <StoryGrid
        title="Most Popular Songs"
        baseUrl="/api/stories/?section=popular"
        initialStories={popularStories}
      />
    </div>
  );
}
