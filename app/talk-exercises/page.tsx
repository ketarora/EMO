"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Send, X } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.65, ease },
};

const seedExercises = [
  { name: "Breathing", min: "3 minutes", cls: "from-[#2dd4bf] to-[#60a5fa]" },
  { name: "Grounding", min: "4 minutes", cls: "from-[#a855f7] to-[#f472b6]" },
  { name: "Gentle stretch", min: "5 minutes", cls: "from-[#fbbf24] to-[#fb7185]" },
  { name: "Relaxing", min: "3 minutes", cls: "from-[#2dd4bf] to-[#60a5fa]" },
  { name: "Video Journaling", min: "4 minutes", cls: "from-[#a855f7] to-[#f472b6]" },
];

const seedFriends = [
  { name: "Arjun", note: "usually online evenings", dot: "bg-teal-300" },
  { name: "Nishtha", note: "check-in buddy since March", dot: "bg-purple-400" },
  { name: "Kiran", note: "feedback provider on prototypes", dot: "bg-teal-400" },
  { name: "Maya", note: "creative consultant for campaigns", dot: "bg-purple-500" },
  { name: "Saanvi", note: "research assistant for user studies", dot: "bg-purple-400" },
];

const pros = [
  {
    id: "anjali",
    name: "Dr. Anjali Rao",
    title: "Clinical Psychologist, M.Phil",
    tags: ["Anxiety", "Relationships"],
    orb: "radial-gradient(circle at 40% 35%, #a5f3fc 0%, #0d9488 35%, #06202a 75%)",
  },
  {
    id: "sameer",
    name: "Dr. Sameer Kapoor",
    title: "Counselling Psychologist",
    tags: ["Stress", "Burnout"],
    orb: "radial-gradient(circle at 40% 35%, #bfdbfe 0%, #2563eb 40%, #060f2a 78%)",
  },
  {
    id: "fatima",
    name: "Dr. Fatima Sheikh",
    title: "Clinical Psychologist, PsyD",
    tags: ["Grief", "Family"],
    orb: "radial-gradient(circle at 40% 35%, #93c5fd 0%, #1d4ed8 42%, #050a25 80%)",
  },
];

const prompts = [
  "I'm sad because I had a fight with my partner",
  "I don't know what to do about work",
];

type Msg = { from: "you" | "ally"; text: string };

export default function TalkPage() {
  const [exercises, setExercises] = useState(seedExercises);
  const [friends, setFriends] = useState(seedFriends);
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [proOpen, setProOpen] = useState<string | null>(null);
  const [proSent, setProSent] = useState<Record<string, boolean>>({});

  const addExercise = () => {
    const name = window.prompt("Name your exercise (e.g. Cold water reset, 2 minutes)?");
    if (!name) return;
    setExercises((e) => [...e, { name: name.slice(0, 28), min: "custom", cls: "from-[#2dd4bf] to-[#a855f7]" }]);
  };

  const addFriend = () => {
    const name = window.prompt("Friend's name?");
    if (!name) return;
    setFriends((f) => [...f, { name: name.slice(0, 20), note: "just added", dot: "bg-teal-300" }]);
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMsgs((m) => [...m, { from: "you", text: clean }]);
    setDraft("");
    try {
      const res = await fetch("/api/ally", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
      const d = await res.json();
      setMsgs((m) => [...m, { from: "ally", text: d.reply ?? "Here to listen — tell me a little more." }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          from: "ally",
          text: "Here to listen, not to replace people. That sounds heavy — want to name one small part of it, then try a 3-minute breathing reset together?",
        },
      ]);
    }
  };

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg className="absolute left-1/2 top-[-20px] h-[320px] w-[1400px] -translate-x-1/2 opacity-40" viewBox="0 0 1400 320" fill="none">
          <path d="M-20 110 C 320 110, 450 20, 700 20 S 1100 110, 1420 250" stroke="#1e3a5f" strokeWidth="1.5" />
        </svg>
        <div className="absolute -right-40 top-[-100px] h-[360px] w-[360px] rounded-full bg-purple-600/25 blur-[130px]" />
        <div className="absolute right-[10%] top-[320px] h-[320px] w-[320px] rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute -left-48 bottom-[-60px] h-[420px] w-[420px] rounded-full bg-blue-700/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[928px] px-5 pb-20 pt-8">
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="text-[28px] font-bold tracking-tight">
          What would help right now?
        </motion.h1>
        <p className="mt-1.5 text-[14px] text-white/55">
          A short guided reset, talking it through, or a professional when it&apos;s more than that.
        </p>

        {/* EXERCISES */}
        <motion.section {...fadeUp} className="mt-5 rounded-[24px] border border-white/[0.07] bg-[#101a3a]/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-bold">Recommended Exercises</h2>
              <p className="text-[13px] text-white/50">A healthy mind means a healthy body.</p>
            </div>
            <button onClick={addExercise} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[13px] font-semibold transition hover:bg-white/10">
              <Plus className="h-4 w-4" /> Add Exercise
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {exercises.map((e) => (
              <div key={e.name} className={`grain relative overflow-hidden rounded-2xl bg-gradient-to-br ${e.cls} p-4 text-black transition-transform hover:-translate-y-1`}>
                <div className="relative text-[14px] font-bold leading-tight">{e.name}</div>
                <div className="relative mt-0.5 text-[11.5px] text-black/70">{e.min}</div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* TALK */}
        <motion.section {...fadeUp} className="mt-8">
          <h2 className="text-[18px] font-bold">Talk it through</h2>
          <p className="text-[13px] text-white/50">With a friend, or with your AI Ally.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/[0.08] bg-[#0b1226] p-6">
              <h3 className="text-[15px] font-bold">Friends</h3>
              <ul className="mt-4 space-y-3.5">
                {friends.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 text-[13.5px]">
                    <span className={`h-7 w-7 rounded-full ${f.dot} shadow-[0_0_16px_rgba(45,212,191,0.5)]`} />
                    <span><span className="text-white/85">{f.name}</span> <span className="text-white/45">— {f.note}</span></span>
                  </li>
                ))}
              </ul>
              <button onClick={addFriend} className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[13px] font-semibold transition hover:bg-white/10">
                <Plus className="h-4 w-4" /> Add a friend
              </button>
            </div>

            <div className="rounded-[24px] border border-white/[0.08] bg-[#0b1226] p-6">
              <h3 className="text-[15px] font-bold">AI Ally</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {prompts.map((p) => (
                  <button key={p} onClick={() => send(p)} className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-left text-[12.5px] text-white/75 transition hover:border-teal-300/40 hover:text-white">
                    {p}
                  </button>
                ))}
              </div>
              <div className="mt-3 max-h-[180px] space-y-2 overflow-y-auto rounded-2xl border border-white/[0.07] bg-black/40 p-4 text-[13px]">
                {msgs.length === 0 && (
                  <p className="text-white/40">
                    Here to listen, not to replace people. Capped at 20 minutes a day, on purpose, so this stays a
                    check-in, not a habit to lean on. Use prompt or write your own thoughts.
                  </p>
                )}
                {msgs.map((m, i) => (
                  <div key={i} className={m.from === "you" ? "text-right" : "text-left"}>
                    <span className={`inline-block max-w-[90%] rounded-2xl px-3.5 py-2 ${m.from === "you" ? "bg-teal-300/15 text-teal-100" : "bg-white/[0.07] text-white/80"}`}>
                      {m.text}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") send(draft); }}
                  placeholder="Write your own thoughts…"
                  className="flex-1 rounded-full border border-white/10 bg-black/50 px-4 py-2.5 text-[13px] outline-none placeholder:text-white/30 focus:border-teal-300/50"
                />
                <button onClick={() => send(draft)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-300 to-blue-500 px-5 py-2.5 text-[13px] font-bold text-black transition hover:opacity-90" aria-label="Send">
                  <Send className="h-4 w-4" /> Start talking
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/35">Demo chat — real LLM + 20 min/day cap comes in backend step.</p>
            </div>
          </div>
        </motion.section>

        {/* PROS */}
        <motion.section {...fadeUp} className="mt-8">
          <h2 className="text-[18px] font-bold">Professional</h2>
          <p className="text-[13px] text-white/50">Licensed psychologists already on EMO, for when a moment needs more than a check-in.</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {pros.map((p) => (
              <div key={p.id} className="rounded-[24px] border border-white/[0.08] bg-[#0b1226] p-5">
                <div className="flex items-start gap-3.5">
                  <span className="h-12 w-12 shrink-0 rounded-full border border-white/10" style={{ background: p.orb }} />
                  <div>
                    <div className="text-[15px] font-bold">{p.name}</div>
                    <div className="text-[12px] text-white/45">{p.title}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full border border-teal-300/25 bg-teal-300/[0.08] px-2.5 py-1 text-[11px] text-teal-200">{t}</span>
                  ))}
                </div>
                <button onClick={() => { setProOpen(p.id); setProSent((s) => ({ ...s, [p.id]: false })); }} className="mt-4 rounded-full border border-white/10 px-5 py-2 text-[13px] font-semibold transition hover:bg-white/10">
                  Message
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {proOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProOpen(null)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur-md">
            <motion.div initial={{ scale: 0.94, y: 14 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-[22px] border border-white/10 bg-[#0a0f1e] p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-[16px] font-bold">Message {pros.find((p) => p.id === proOpen)?.name}</h3>
                <button onClick={() => setProOpen(null)} aria-label="Close" className="rounded-full p-1.5 text-white/50 hover:bg-white/10"><X className="h-4 w-4" /></button>
              </div>
              {proSent[proOpen] ? (
                <p className="mt-3 text-[13.5px] text-teal-200">Request sent ✓ — they typically reply within a day. For urgent help, please contact local emergency services.</p>
              ) : (
                <>
                  <p className="mt-2 text-[13px] text-white/55">Share what&apos;s on your mind — this is a demo inbox until backend messaging lands.</p>
                  <button onClick={() => setProSent((s) => ({ ...s, [proOpen]: true }))} className="mt-4 w-full rounded-full bg-gradient-to-r from-teal-300 to-blue-500 py-2.5 text-[13px] font-bold text-black hover:opacity-90">
                    Send request
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
