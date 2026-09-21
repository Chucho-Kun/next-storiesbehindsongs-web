import { getRelatedTags } from "@/db/queries";
import { TagPill } from "@/shared/ui/TagPill";

const RELATED_TAGS_LIMIT = 12;

export async function RelatedTags({ tagSlug }: { tagSlug: string }) {
  const related = await getRelatedTags(tagSlug, RELATED_TAGS_LIMIT);
  if (related.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
      <h2 className="mb-4 text-2xl font-bold text-title">Related Tags</h2>
      <ul className="flex flex-wrap gap-2">
        {related.map((tag) => (
          <li key={tag.slug}>
            <TagPill tag={tag} count={tag.sharedCount} />
          </li>
        ))}
      </ul>
    </section>
  );
}
