import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const bands = pgTable(
  "bands",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    logoPath: text("logo_path").notNull(),
  },
  (table) => [unique("bands_slug_unique").on(table.slug)],
);

export const stories = pgTable(
  "stories",
  {
    id: serial("id").primaryKey(),
    legacyId: integer("legacy_id").notNull(),
    bandId: integer("band_id")
      .notNull()
      .references(() => bands.id),
    slug: varchar("slug", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    subtitle: text("subtitle"),
    album: varchar("album", { length: 255 }).notNull(),
    youtubeId: varchar("youtube_id", { length: 32 }).notNull(),
    shortId: varchar("short_id", { length: 32 }),
    shortRange: varchar("short_range", { length: 32 }),
    bodyHtml: text("body_html").notNull(),
    lyrics: text("lyrics"),
    faqs: jsonb("faqs").$type<{
      author: string;
      meaning: string;
      facts: string;
      lyrics: string;
    }>(),
    coverPath: text("cover_path").notNull(),
    views: integer("views").notNull().default(0),
  },
  (table) => [
    unique("stories_band_slug_unique").on(table.bandId, table.slug),
    index("stories_views_idx").on(table.views),
    index("stories_id_desc_idx").on(table.id.desc()),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
  },
  (table) => [unique("tags_slug_unique").on(table.slug)],
);

export const storyTags = pgTable(
  "story_tags",
  {
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.storyId, table.tagId] })],
);
