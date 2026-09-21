import type { Metadata } from "next";
import type { BandDetail } from "@/db/queries";
import { SITE_URL, truncate } from "@/lib/story-seo";

export function bandPath(band: Pick<BandDetail, "slug">): string {
  return `/bands/${band.slug}/`;
}

function bandDescription(band: BandDetail): string {
  const firstParagraph = band.description.split("\n\n")[0];
  return truncate(
    firstParagraph || `Discover the stories behind the songs of ${band.name}.`,
    160,
  );
}

export function buildBandMetadata(band: BandDetail): Metadata {
  const title = `${band.name} Song Stories`;
  const description = bandDescription(band);
  const path = bandPath(band);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "Stories Behind Songs",
      type: "website",
      images: [{ url: band.logoPath, alt: `${band.name} logo` }],
    },
  };
}

export function buildBandBreadcrumbJsonLd(band: BandDetail) {
  const items = [
    { name: "Home", url: `${SITE_URL}/` },
    { name: band.name, url: `${SITE_URL}${bandPath(band)}` },
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

export function buildMusicGroupJsonLd(band: BandDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: band.name,
    url: `${SITE_URL}${bandPath(band)}`,
    image: `${SITE_URL}${band.logoPath}`,
    description: bandDescription(band),
    ...(band.genre && { genre: band.genre }),
    ...(band.founded && { foundingDate: band.founded }),
    ...(band.location && { foundingLocation: { "@type": "Place", name: band.location } }),
  };
}
