import { NextResponse } from "next/server";
import { getPosts, likePost } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ posts: await getPosts() });
}

export async function POST(req: Request) {
  let body: { id?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.id !== "string" || !body.id)
    return NextResponse.json({ error: "id required" }, { status: 400 });
  const post = await likePost(body.id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}
