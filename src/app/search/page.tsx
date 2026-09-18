import { searchStories } from "@/db/queries";
import { StoryGrid } from "@/shared/sections/StoryGrid";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const stories = query.length > 0 ? await searchStories(query, 20, 0) : [];

  return (
    <div className="bg-background">
      <StoryGrid
        title={query ? `Results for "${query}"` : "Search"}
        baseUrl={`/api/search/?q=${encodeURIComponent(query)}`}
        initialStories={stories}
        emptyMessage={
          query
            ? `No results found for "${query}". Try a different song or band.`
            : "Type a song or band name in the header to search."
        }
      />
    </div>
  );
}
