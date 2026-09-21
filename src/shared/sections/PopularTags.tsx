import Link from "next/link";
import { getPopularTags } from "@/db/queries";
import { TagPill } from "@/shared/ui/TagPill";

export async function PopularTags() {
  const tags = await getPopularTags(20, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h2 className="mb-4 text-2xl font-bold text-title">Popular Tags</h2>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <TagPill tag={tag} />
          </li>
        ))}
      </ul>
      <Link href="/tags/" className="mt-4 inline-block text-sm text-muted hover:text-title">
        View all tags →
      </Link>
    </section>
  );
}
