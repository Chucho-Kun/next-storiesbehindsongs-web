CREATE TABLE "albums" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_id" integer NOT NULL,
	"band_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"release_date" date NOT NULL,
	"cover_path" text NOT NULL,
	"url" text NOT NULL,
	CONSTRAINT "albums_legacy_id_unique" UNIQUE("legacy_id")
);
--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "location" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "country_code" varchar(2) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "founded" varchar(16) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "genre" varchar(64) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "bands" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_band_id_bands_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."bands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "albums_band_id_idx" ON "albums" USING btree ("band_id");