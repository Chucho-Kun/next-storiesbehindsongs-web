CREATE TABLE "bands" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_path" text NOT NULL,
	CONSTRAINT "bands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_id" integer NOT NULL,
	"band_id" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"album" varchar(255) NOT NULL,
	"youtube_id" varchar(32) NOT NULL,
	"short_id" varchar(32),
	"short_range" varchar(32),
	"body_html" text NOT NULL,
	"lyrics" text,
	"faqs" jsonb,
	"cover_path" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stories_band_slug_unique" UNIQUE("band_id","slug")
);
--> statement-breakpoint
CREATE TABLE "story_tags" (
	"story_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "story_tags_story_id_tag_id_pk" PRIMARY KEY("story_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_tags" ADD CONSTRAINT "story_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stories_views_idx" ON "stories" USING btree ("views");--> statement-breakpoint
CREATE INDEX "stories_id_desc_idx" ON "stories" USING btree ("id" DESC NULLS LAST);