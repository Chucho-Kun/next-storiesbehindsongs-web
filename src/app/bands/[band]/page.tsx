import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import {
  getAlbumsByBand,
  getAllBandSlugs,
  getBandBySlug,
  getPopularStories,
  getRecentStories,
} from "@/db/queries";
import {
  buildBandBreadcrumbJsonLd,
  buildBandMetadata,
  buildMusicGroupJsonLd,
} from "@/lib/band-seo";
import { jsonLdString } from "@/lib/story-seo";
import { AlbumShelf } from "@/shared/sections/AlbumShelf";
import { BandInfo } from "@/shared/sections/BandInfo";
import { PopularBands } from "@/shared/sections/PopularBands";
import { StoryGrid } from "@/shared/sections/StoryGrid";

type Params = { band: string };

const PAGE_SIZE = 20;

const loadBand = cache(getBandBySlug);

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllBandSlugs();
  return slugs.map((band) => ({ band }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { band: bandSlug } = await params;
  const band = await loadBand(bandSlug);
  if (!band) notFound();

  return buildBandMetadata(band);
}

export default async function BandPage({ params }: { params: Promise<Params> }) {
  const { band: bandSlug } = await params;
  const band = await loadBand(bandSlug);
  if (!band) notFound();

  const [albums, recentStories, popularStories] = await Promise.all([
    getAlbumsByBand(band.id),
    getRecentStories(PAGE_SIZE, 0, band.slug),
    getPopularStories(PAGE_SIZE, 0, undefined, band.slug),
  ]);

  const jsonLd = [buildBandBreadcrumbJsonLd(band), buildMusicGroupJsonLd(band)];

  return (
    <div className="bg-background">
      {jsonLd.map((data) => (
        <script
          key={data["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
        />
      ))}
      <BandInfo band={band} />
      <AlbumShelf albums={albums} />
      <StoryGrid
        title={`Recent Articles About ${band.name}`}
        baseUrl={`/api/stories/?section=recent&band=${band.slug}`}
        initialStories={recentStories}
      />
      <PopularBands />
      <StoryGrid
        title={`Most Popular Songs of ${band.name}`}
        baseUrl={`/api/stories/?section=popular&band=${band.slug}`}
        initialStories={popularStories}
      />
    </div>
  );
}
