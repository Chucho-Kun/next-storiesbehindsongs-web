"use client";

import { useState, useTransition } from "react";
import type { StoryCard as StoryCardData } from "@/db/queries";
import { StoryCard } from "@/shared/ui/StoryCard";

const PAGE_SIZE = 20;

export function StoryGrid({
  title,
  baseUrl,
  initialStories,
  emptyMessage,
}: {
  title: string;
  /** API endpoint (with its own query params) that this grid paginates against;
   * `&offset=N` is appended on each "View More" click. */
  baseUrl: string;
  initialStories: StoryCardData[];
  emptyMessage?: string;
}) {
  const [stories, setStories] = useState(initialStories);
  const [hasMore, setHasMore] = useState(initialStories.length === PAGE_SIZE);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const offset = stories.length;
      const response = await fetch(`${baseUrl}&offset=${offset}`);
      const data: { stories: StoryCardData[] } = await response.json();
      setStories((prev) => [...prev, ...data.stories]);
      setHasMore(data.stories.length === PAGE_SIZE);
    });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h2 className="mb-4 text-2xl font-bold text-title">{title}</h2>
      {stories.length === 0 ? (
        <p className="text-muted">{emptyMessage ?? "No results found."}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isPending}
            className="bg-title px-6 py-2 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
          >
            {isPending ? "Loading..." : "View More"}
          </button>
        </div>
      )}
    </section>
  );
}
