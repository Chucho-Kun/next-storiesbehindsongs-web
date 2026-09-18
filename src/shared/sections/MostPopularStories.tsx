import { getPopularStories } from "@/db/queries";
import { StoryCardGrid } from "@/shared/ui/StoryCardGrid";

export async function MostPopularStories({ excludeId }: { excludeId: number }) {
  const stories = await getPopularStories(8, 0, excludeId);
  if (stories.length === 0) return null;

  return <StoryCardGrid title="Most Popular Stories" stories={stories} />;
}
