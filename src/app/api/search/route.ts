import { NextRequest, NextResponse } from "next/server";
import { searchStories } from "@/db/queries";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const offset = Number(searchParams.get("offset") ?? "0");

  if (!Number.isInteger(offset) || offset < 0) {
    return NextResponse.json({ error: "Invalid offset" }, { status: 400 });
  }

  if (query.length === 0) {
    return NextResponse.json({ stories: [] });
  }

  const stories = await searchStories(query, PAGE_SIZE, offset);
  return NextResponse.json({ stories });
}
