import { NextRequest, NextResponse } from "next/server";
import { getPopularStories, getRecentStories } from "@/db/queries";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");
  const offset = Number(searchParams.get("offset") ?? "0");

  if (section !== "recent" && section !== "popular") {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }
  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
  }

  const stories =
    section === "recent"
      ? await getRecentStories(PAGE_SIZE, offset)
      : await getPopularStories(PAGE_SIZE, offset);

  return NextResponse.json({ stories });
}
