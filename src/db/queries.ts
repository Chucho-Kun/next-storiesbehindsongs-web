import { and, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
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

export type StoryDetail = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  album: string;
  youtubeId: string;
  bodyHtml: string;
  lyrics: string | null;
  faqs: { author: string; meaning: string; facts: string; lyrics: string } | null;
  coverPath: string;
  views: number;
  publishedAt: Date;
  band: { slug: string; name: string; logoPath: string };
  tags: { slug: string; name: string }[];
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

export async function getPopularStories(
  limit: number,
  offset = 0,
  excludeId?: number,
): Promise<StoryCard[]> {
  const rows = await db
    .select(storyCardColumns)
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id))
    .where(excludeId === undefined ? undefined : ne(stories.id, excludeId))
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

export async function getStoryBySlugs(
  bandSlug: string,
  storySlug: string,
): Promise<StoryDetail | null> {
  const [row] = await db
    .select({
      id: stories.id,
      slug: stories.slug,
      title: stories.title,
      subtitle: stories.subtitle,
      album: stories.album,
      youtubeId: stories.youtubeId,
      bodyHtml: stories.bodyHtml,
      lyrics: stories.lyrics,
      faqs: stories.faqs,
      coverPath: stories.coverPath,
      views: stories.views,
      publishedAt: stories.publishedAt,
      bandSlug: bands.slug,
      bandName: bands.name,
      bandLogoPath: bands.logoPath,
    })
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id))
    .where(and(eq(bands.slug, bandSlug), eq(stories.slug, storySlug)))
    .limit(1);

  if (!row) return null;

  const storyTagRows = await db
    .select({ slug: tags.slug, name: tags.name })
    .from(storyTags)
    .innerJoin(tags, eq(storyTags.tagId, tags.id))
    .where(eq(storyTags.storyId, row.id))
    .orderBy(tags.name);

  const { bandSlug: bSlug, bandName, bandLogoPath, ...story } = row;
  return {
    ...story,
    band: { slug: bSlug, name: bandName, logoPath: bandLogoPath },
    tags: storyTagRows,
  };
}

export async function getRelatedStories(
  storyId: number,
  tagSlugs: string[],
  limit: number,
): Promise<StoryCard[]> {
  if (tagSlugs.length === 0) return [];

  const rows = await db
    .select(storyCardColumns)
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id))
    .innerJoin(storyTags, eq(storyTags.storyId, stories.id))
    .innerJoin(tags, eq(storyTags.tagId, tags.id))
    .where(and(ne(stories.id, storyId), inArray(tags.slug, tagSlugs)))
    .groupBy(stories.id, bands.id)
    .orderBy(desc(sql`count(${tags.id})`), desc(stories.views))
    .limit(limit);

  return rows.map(toStoryCard);
}

export async function getAllStorySlugs(): Promise<{ band: string; song: string }[]> {
  return db
    .select({ band: bands.slug, song: stories.slug })
    .from(stories)
    .innerJoin(bands, eq(stories.bandId, bands.id));
}
