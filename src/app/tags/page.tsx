import type { Metadata } from "next";
import { getAllTags } from "@/db/queries";
import { jsonLdString } from "@/lib/story-seo";
import { buildTagsIndexBreadcrumbJsonLd, buildTagsIndexMetadata } from "@/lib/tag-seo";
import { Breadcrumb } from "@/shared/ui/Breadcrumb";
import { TagPill } from "@/shared/ui/TagPill";

export async function generateMetadata(): Promise<Metadata> {
  const tags = await getAllTags();
  return buildTagsIndexMetadata(tags.length);
}

export default async function TagsIndexPage() {
  const tags = await getAllTags();

  return (
    <div className="bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(buildTagsIndexBreadcrumbJsonLd()) }}
      />
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Tags" }]} />
        <h1 className="mb-6 mt-6 text-3xl font-bold text-title sm:text-4xl">All Tags</h1>
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <TagPill tag={tag} count={tag.count} variant="light" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
