import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { bands, stories, storyTags, tags } from "../src/db/schema";
import { normalizeBodyHtml, normalizeLyrics } from "./normalize-content";
import { parseLegacySql, type LegacyStoryRow } from "./parse-legacy-sql";
import { slugify, splitTitle } from "./slug";

type Faqs = { author: string; meaning: string; facts: string; lyrics: string };

function parseFaqs(raw: string): Faqs {
  const [entry] = JSON.parse(raw) as { a: string; b: string; c: string; d: string }[];
  return { author: entry.a, meaning: entry.b, facts: entry.c, lyrics: entry.d };
}

async function upsertBand(name: string, slug: string, logoPath: string) {
  const [band] = await db
    .insert(bands)
    .values({ slug, name, logoPath })
    .onConflictDoUpdate({ target: bands.slug, set: { name, logoPath } })
    .returning();
  return band;
}

async function upsertTag(name: string, slug: string) {
  const [tag] = await db
    .insert(tags)
    .values({ slug, name })
    .onConflictDoUpdate({ target: tags.slug, set: { name } })
    .returning();
  return tag;
}

/** Idempotent by `legacyId`: no DB constraint enforces it (only the spec's
 * documented `bandId+slug` unique does), so existence is checked in code. */
async function upsertStory(row: LegacyStoryRow, bandId: number, bandSlug: string) {
  const { title, subtitle } = splitTitle(row.titulo);
  const slug = slugify(title);

  const values = {
    legacyId: row.legacyId,
    bandId,
    slug,
    title,
    subtitle,
    album: row.album,
    youtubeId: row.video,
    shortId: row.short.length > 0 ? row.short : null,
    shortRange: row.duration.length > 0 ? row.duration : null,
    bodyHtml: normalizeBodyHtml(row.texto, bandSlug, slug),
    lyrics: normalizeLyrics(row.letra),
    faqs: parseFaqs(row.faqs),
    coverPath: `/covers/${bandSlug}-${slug}.webp`,
    views: row.vistas,
  };

  const [existing] = await db
    .select({ id: stories.id })
    .from(stories)
    .where(eq(stories.legacyId, row.legacyId))
    .limit(1);

  if (existing) {
    const [story] = await db
      .update(stories)
      .set(values)
      .where(eq(stories.id, existing.id))
      .returning();
    return story;
  }

  const [story] = await db.insert(stories).values(values).returning();
  return story;
}

async function syncStoryTags(storyId: number, tagIds: number[]) {
  await db.delete(storyTags).where(eq(storyTags.storyId, storyId));
  if (tagIds.length === 0) return;
  await db.insert(storyTags).values(tagIds.map((tagId) => ({ storyId, tagId })));
}

async function seed() {
  const rows = parseLegacySql();
  const bandCache = new Map<string, { id: number }>();
  const tagCache = new Map<string, { id: number }>();

  for (const row of rows) {
    const bandSlug = slugify(row.banda);
    let band = bandCache.get(bandSlug);
    if (!band) {
      band = await upsertBand(row.banda, bandSlug, `/bands/${bandSlug}.webp`);
      bandCache.set(bandSlug, band);
    }

    const story = await upsertStory(row, band.id, bandSlug);

    const tagNames = row.categorias
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const tagIds: number[] = [];
    for (const tagName of tagNames) {
      const tagSlug = slugify(tagName);
      let tag = tagCache.get(tagSlug);
      if (!tag) {
        tag = await upsertTag(tagName, tagSlug);
        tagCache.set(tagSlug, tag);
      }
      tagIds.push(tag.id);
    }

    await syncStoryTags(story.id, tagIds);
  }

  const allBands = await db.select().from(bands);
  const allStories = await db.select({ id: stories.id }).from(stories);
  const allTags = await db.select().from(tags);
  const linkedStoryIds = new Set(
    (await db.select({ storyId: storyTags.storyId }).from(storyTags)).map((row) => row.storyId),
  );
  const storiesWithoutTags = allStories.filter((story) => !linkedStoryIds.has(story.id));

  console.log(`${allStories.length} historias`);
  console.log(`${allBands.length} bandas`);
  console.log(`${allTags.length} tags`);
  console.log(`${storiesWithoutTags.length} historias sin tags`);
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
