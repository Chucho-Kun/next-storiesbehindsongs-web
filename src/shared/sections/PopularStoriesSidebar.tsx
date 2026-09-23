import { getPopularStories } from "@/db/queries";
import { SidebarStoryCard } from "@/shared/ui/SidebarStoryCard";

export async function PopularStoriesSidebar({ excludeId }: { excludeId: number }) {
  const stories = await getPopularStories(8, 0, excludeId);
  if (stories.length === 0) return null;

  return (
    <aside className="border border-neutral-200 bg-white">
      <div className="h-1.5 bg-[var(--title-red)]" />
      <h2 className="px-4 py-4 text-center text-lg font-bold uppercase tracking-wide text-neutral-700">
        Most Popular Stories
      </h2>
      <div className="divide-y divide-neutral-200 border-t border-neutral-200">
        {stories.map((story) => (
          <SidebarStoryCard key={story.id} story={story} />
        ))}
      </div>
    </aside>
  );
}
