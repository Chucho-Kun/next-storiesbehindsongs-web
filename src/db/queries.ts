import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "./index";
import { bands, stories, storyTags, tags } from "./schema";

export type StoryCard = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  album: string;
  coverPath: string;
  views: number;
  band: { slug: string; name: string; logoPath: string };
};

export type PopularTag = { slug: string; name: string; count: number };

export type BandSummary = { slug: string; name: string; logoPath: string; storyCount: number };

const storyCardColumns = {
  id: stories.id,
  slug: stories.slug,
  title: stories.title,
  subtitle: stories.subtitle,
  album: stories.album,
  coverPath: stories.coverPath,
  views: stories.views,
  bandSlug: bands.slug,
  bandName: bands.name,
  bandLogoPath: bands.logoPath,
};

function toStoryCard(row: {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  album: string;
  coverPath: string;
  views: number;
  bandSlug: string;
  bandName: string;
  bandLogoPath: string;
}): StoryCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    album: row.album,
    coverPath: row.coverPath,
    views: row.views,
    band: { slug: row.bandSlug, name: row.bandName, logoPath: row.bandLogoPath },
  };
}

export async function getRecentStories(limit: number, offset = 0): Promise<StoryCard[]> {
  const rows = await db
    .select(storyCardColumns)
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id))
    .orderBy(desc(stories.id))
    .limit(limit)
    .offset(offset);

  return rows.map(toStoryCard);
}

export async function getPopularStories(limit: number, offset = 0): Promise<StoryCard[]> {
  const rows = await db
    .select(storyCardColumns)
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id))
    .orderBy(desc(stories.views))
    .limit(limit)
    .offset(offset);

  return rows.map(toStoryCard);
}

export async function getPopularTags(limit: number, offset = 0): Promise<PopularTag[]> {
  return db
    .select({
      slug: tags.slug,
      name: tags.name,
      count: sql<number>`count(${storyTags.storyId})::int`,
    })
    .from(tags)
    .innerJoin(storyTags, eq(storyTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(desc(sql`count(${storyTags.storyId})`))
    .limit(limit)
    .offset(offset);
}

export async function getBands(limit: number, offset = 0): Promise<BandSummary[]> {
  return db
    .select({
      slug: bands.slug,
      name: bands.name,
      logoPath: bands.logoPath,
      storyCount: sql<number>`count(${stories.id})::int`,
    })
    .from(bands)
    .leftJoin(stories, eq(stories.bandId, bands.id))
    .groupBy(bands.id)
    .orderBy(desc(sql`count(${stories.id})`))
    .limit(limit)
    .offset(offset);
}

export async function searchStories(
  query: string,
  limit: number,
  offset = 0,
): Promise<StoryCard[]> {
  const pattern = `%${query}%`;
  const rows = await db
    .select(storyCardColumns)
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id))
    .where(or(ilike(stories.title, pattern), ilike(bands.name, pattern), ilike(stories.album, pattern)))
    .orderBy(desc(stories.views))
    .limit(limit)
    .offset(offset);

  return rows.map(toStoryCard);
}
