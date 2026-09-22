import type { StoryCard as StoryCardData } from "@/db/queries";
import { StoryCard } from "@/shared/ui/StoryCard";

/** Static (non-paginated) titled grid of story cards, same columns as `StoryGrid`. */
export function StoryCardGrid({
  title,
  stories,
}: {
  title: string;
  stories: StoryCardData[];
}) {
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold text-neutral-900">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>
    </section>
  );
}
