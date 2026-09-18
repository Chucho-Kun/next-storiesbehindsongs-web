import { getRelatedStories } from "@/db/queries";
import { StoryCardGrid } from "@/shared/ui/StoryCardGrid";

export async function RelatedSongs({
  storyId,
  tagSlugs,
}: {
  storyId: number;
  tagSlugs: string[];
}) {
  const stories = await getRelatedStories(storyId, tagSlugs, 8);
  if (stories.length === 0) return null;

  return <StoryCardGrid title="Related Songs" stories={stories} />;
}
