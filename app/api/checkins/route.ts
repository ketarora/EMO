import { NextResponse } from "next/server";
import { addCheckin, getCheckins } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ checkins: await getCheckins() });
}

export async function POST(req: Request) {
  let body: { valence?: unknown; energy?: unknown; note?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const valence = Number(body.valence);
  const energy = Number(body.energy);
  if (!Number.isFinite(valence) || valence < -3 || valence > 3)
    return NextResponse.json({ error: "valence must be -3..3" }, { status: 400 });
  if (!Number.isFinite(energy) || energy < -3 || energy > 3)
    return NextResponse.json({ error: "energy must be -3..3" }, { status: 400 });
  const entry = await addCheckin({
    date: new Date().toISOString(),
    valence,
    energy,
    note: typeof body.note === "string" ? body.note.slice(0, 500) : undefined,
  });
  return NextResponse.json({ checkin: entry }, { status: 201 });
}
