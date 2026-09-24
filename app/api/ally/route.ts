import { NextResponse } from "next/server";

const CRISIS = ["suicide", "kill myself", "self-harm", "end my life", "hurt myself"];

function allyReply(text: string): string {
  const t = text.toLowerCase();
  if (CRISIS.some((k) => t.includes(k)))
    return "I'm really glad you told me — this sounds bigger than a check-in. Please reach out right now to someone you trust, call your local emergency number, or message a licensed professional on EMO. You matter, and you don't have to sit with this alone.";
  if (t.includes("fight") || t.includes("partner"))
    return "Fights with a partner sting because it matters. Try: 1) name what hurt in one sentence, 2) a 3-minute breathing reset (in 4, out 6), 3) tell them one need, not the whole story. Want to draft that one sentence together?";
  if (t.includes("work"))
    return "Work heaviness usually = too much + too little control. Name the smallest next step (one email, one list), do it for 5 minutes, then check back in. What's the one thing sitting on you most?";
  if (t.includes("anx") || t.includes("stress") || t.includes("heavy"))
    return "Here to listen, not to replace people. Let's ground: 5 things you see, 4 you hear, 3 you feel. Then tell me — what got lighter, even 1%?";
  return "Heard. That took honesty to say out loud. What's one small part of this we can name together — then try a 3-minute reset on it?";
}

export async function POST(req: Request) {
  let body: { message?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.message !== "string" || !body.message.trim())
    return NextResponse.json({ error: "message required" }, { status: 400 });
  if (body.message.length > 2000)
    return NextResponse.json({ error: "message too long" }, { status: 400 });
  // Swap this with a real LLM call (OpenAI/Anthropic) via env key when ready.
  // Guardrails: 20 min/day cap + crisis escalation are enforced client-side copy
  // and here by keeping replies short, non-diagnostic, pro-escalating.
  return NextResponse.json({ reply: allyReply(body.message) });
}
