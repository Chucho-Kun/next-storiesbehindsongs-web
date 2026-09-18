import { getPopularTags } from "@/db/queries";

export async function PopularTags() {
  const tags = await getPopularTags(20, 0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h2 className="mb-4 text-2xl font-bold text-title">Popular Tags</h2>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li
            key={tag.slug}
            className="rounded-full border border-neutral-700 px-3 py-1 text-sm text-foreground"
          >
            {tag.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
