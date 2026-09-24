"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, Heart, Plus, Share, X } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

type Post = {
  id: string;
  name: string;
  quote: string;
  art: string;
  dot: string;
  featured?: boolean;
};

const posts: Post[] = [
  {
    id: "ishaan",
    name: "Ishaan",
    quote: "grateful for everything today, thanks for asking",
    art: "radial-gradient(circle at 50% 55%, rgba(94,234,212,.95) 0%, rgba(13,60,60,.9) 35%, rgba(4,10,18,.98) 72%)",
    dot: "bg-teal-300",
  },
  {
    id: "ritika",
    name: "Ritika",
    quote: "was a lot today but sitting with it now",
    art: "radial-gradient(circle at 55% 45%, rgba(192,132,252,.9) 0%, rgba(60,10,80,.85) 38%, rgba(5,5,15,.98) 75%)",
    dot: "bg-purple-400",
  },
  {
    id: "devansh",
    name: "Devansh",
    quote: "small win, actually took a break at 3pm",
    art: "radial-gradient(circle at 50% 55%, rgba(45,212,191,.9) 0%, rgba(8,40,38,.9) 40%, rgba(3,8,14,.98) 75%)",
    dot: "bg-teal-400",
  },
  {
    id: "ayesha",
    name: "Ayesha",
    quote: "not sure what this is, just logging it",
    art: "radial-gradient(circle at 50% 60%, rgba(147,197,253,.9) 0%, rgba(20,40,90,.85) 42%, rgba(3,6,16,.98) 78%)",
    dot: "bg-blue-400",
  },
  {
    id: "kabir",
    name: "Kabir",
    quote: "good day, oddly calm",
    art: "radial-gradient(circle at 50% 55%, rgba(125,211,252,.9) 0%, rgba(15,45,70,.88) 42%, rgba(3,7,15,.98) 76%)",
    dot: "bg-sky-400",
  },
  {
    id: "meher",
    name: "Meher",
    quote: "heavy morning, better by evening",
    art: "radial-gradient(circle at 55% 55%, rgba(168,85,247,.9) 0%, rgba(50,15,80,.85) 42%, rgba(6,4,16,.98) 78%)",
    dot: "bg-purple-500",
  },
];

const exercises = [
  { name: "Breathing", min: "3 minutes", cls: "from-[#2dd4bf] to-[#60a5fa]" },
  { name: "Grounding", min: "4 minutes", cls: "from-[#a855f7] to-[#f472b6]" },
  { name: "Gentle stretch", min: "5 minutes", cls: "from-[#fbbf24] to-[#fb7185]" },
  { name: "Relaxing", min: "3 minutes", cls: "from-[#2dd4bf] to-[#60a5fa]" },
  { name: "Video Journaling", min: "4 minutes", cls: "from-[#a855f7] to-[#f472b6]" },
];

function Art({ art, className = "" }: { art: string; className?: string }) {
  return (
    <div className={`grain-soft relative overflow-hidden ${className}`} style={{ background: art }}>
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.5)_0.6px,transparent_0.7px)] [background-size:14px_14px]" />
    </div>
  );
}

export default function CommunityPage() {
  const [selected, setSelected] = useState<Post | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({ ishaan: false });
  const [gallerySaved, setGallerySaved] = useState<Record<string, boolean>>({});
  const [savedMain, setSavedMain] = useState(false);
  const [feed, setFeed] = useState<Post[]>(posts);

  useEffect(() => {
    try {
      const g = localStorage.getItem("emo_gallery");
      if (g) setGallerySaved(JSON.parse(g));
      setSavedMain(localStorage.getItem("emo_main_saved") === "true");
    } catch {}
    
    fetch("/api/posts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.posts?.length) setFeed(d.posts);
      })
      .catch(() => {});
  }, []);

  const toggleLike = async (id: string) => {
    setLiked((p) => ({ ...p, [id]: !p[id] }));
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const d = await res.json();
      if (d?.post) setFeed((f) => f.map((x) => (x.id === id ? { ...x, likes: d.post.likes } : x)));
    } catch {}
  };

  const handleShare = async () => {
    const text = "Today's Mood — Seems like you had a good today, calm throughout.";
    try {
      if (navigator.share) await navigator.share({ title: "emo", text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  };

  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg className="absolute left-1/2 top-[-20px] h-[340px] w-full -translate-x-1/2 opacity-25" viewBox="0 0 1400 340" fill="none" preserveAspectRatio="none">
          <path d="M-20 120 C 320 120, 450 20, 700 20 S 1100 120, 1420 260" stroke="#1e3a5f" strokeWidth="1.5" />
        </svg>
        <div className="absolute -right-40 top-[-100px] h-[360px] w-[360px] rounded-full bg-purple-600/12 blur-[130px]" />
        <div className="absolute -left-48 bottom-[-60px] h-[420px] w-[420px] rounded-full bg-blue-700/12 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[928px] px-5 pb-20 pt-8">
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="text-[28px] font-bold tracking-tight">
          Others feeling this right now.
        </motion.h1>
        <p className="mt-1.5 max-w-[620px] text-[14px] text-white/55">
          Check-ins people have chosen to share. Nothing here is forced — everyone opted in.
        </p>
        <p className="mt-1 text-[14px] text-white/55">Tap any card below to see its expanded options in the next block.</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
          {/* LEFT featured */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="rounded-[24px] border border-white/[0.08] bg-[#131c3a]/90 p-4"
          >
            <Art art={feed[0].art} className="h-[240px] rounded-2xl border border-white/10" />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  const next = !savedMain;
                  setSavedMain(next);
                  localStorage.setItem("emo_main_saved", String(next));
                }}
                className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/12 py-2.5 text-[13.5px] font-semibold transition ${savedMain ? "bg-teal-300 text-black" : "bg-white/[0.07] hover:bg-white/[0.14]"}`}
              >
                <Bookmark className="h-4 w-4" /> {savedMain ? "In Gallery" : "Gallery"}
              </button>
              <button onClick={handleShare} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.07] py-2.5 text-[13.5px] font-semibold transition hover:bg-white/[0.14]">
                <Share className="h-4 w-4" /> Share
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-[11.5px] text-white/40"><span>Ease</span><span>64%</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/60">
                  <motion.div initial={{ width: 0 }} animate={{ width: "64%" }} transition={{ duration: 1, ease }} className="h-full rounded-full bg-gradient-to-r from-teal-300 to-blue-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11.5px] text-white/40"><span>Charge</span><span>38%</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/60">
                  <motion.div initial={{ width: 0 }} animate={{ width: "38%" }} transition={{ duration: 1, delay: 0.15, ease }} className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                </div>
              </div>
            </div>

            <h2 className="mt-5 text-[24px] font-extrabold">Today&apos;s Mood</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/60">
              Seems like you had a good today you were calm throughout. Share your artwork, let others guess your
              mood today !
            </p>
            <div className="mt-4 space-y-2.5">
              {["Talk to others!", "Ask AI Bot!", "Consult professional!"].map((t) => (
                <button key={t} className="w-full rounded-xl bg-black/70 px-4 py-3 text-left text-[13.5px] font-medium transition hover:bg-black">
                  {t}
                </button>
              ))}
            </div>
          </motion.aside>

          {/* RIGHT */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold">Exercises your friends tried!</h2>
                <p className="text-[13px] text-white/50">A healthy mind means a healthy body.</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[13px] font-semibold transition hover:bg-white/10">
                <Plus className="h-4 w-4" /> Add Exercise
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-3">
              {exercises.map((e, i) => (
                <motion.div key={e.name} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.06, ease }}>
                  <button className={`grain relative block h-[80px] w-full overflow-hidden rounded-2xl bg-gradient-to-br ${e.cls} p-4 text-left text-black transition-transform hover:-translate-y-1`}>
                    <div className="relative text-[14px] font-bold leading-tight">{e.name}</div>
                    <div className="relative mt-0.5 text-[11.5px] text-black/70">{e.min}</div>
                  </button>
                </motion.div>
              ))}            </div>

            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold">Check on your friends!</h2>
                <p className="text-[13px] text-white/50">A friend in need is a friend in deed.</p>
              </div>
              <button className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-[13px] font-semibold transition hover:bg-white/10">
                <Plus className="h-4 w-4" /> Add a friend
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-4 xl:grid-cols-3">
              {feed.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease }}
                  className={`overflow-hidden rounded-2xl border bg-[#0b1226] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_-16px_rgba(56,189,248,0.35)] ${selected?.id === p.id ? "border-teal-300/70" : "border-white/[0.08]"}`}
                >
                  <button onClick={() => setSelected(p)} className="block w-full text-left">
                    <div className="relative">
                      <Art art={p.art} className="h-[190px]" />
                      <span
                        onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 backdrop-blur transition hover:bg-black/80"
                        aria-label="like"
                      >
                        <Heart className={`h-4 w-4 ${liked[p.id] ? "fill-rose-400 text-rose-400" : "text-white/80"}`} />
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="min-h-[42px] text-[13.5px] leading-snug text-white/85">“{p.quote}”</p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className={`h-5 w-5 rounded-full ${p.dot} shadow-[0_0_14px_rgba(45,212,191,0.6)]`} />
                        <span className="text-[12.5px] text-white/50">{p.name}</span>
                      </div>
                    </div>
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED MODAL — Figma 21:6390 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-5 backdrop-blur-md"
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[460px] rounded-[22px] border border-teal-200/60 bg-[#0a0f1e]/95 p-6 shadow-[0_30px_90px_-20px_rgba(45,212,191,0.4)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`h-9 w-9 rounded-full ${selected.dot} shadow-[0_0_20px_rgba(45,212,191,0.6)]`} />
                  <p className="text-[14.5px] font-medium leading-snug">
                    {selected.name} — “{selected.quote}”
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setGallerySaved(prev => {
                        const next = { ...prev, [selected.id]: !prev[selected.id] };
                        localStorage.setItem("emo_gallery", JSON.stringify(next));
                        return next;
                      });
                    }}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${gallerySaved[selected.id] ? "bg-teal-400/10 text-teal-200 border border-teal-300/40" : "bg-white/10 hover:bg-white/20"}`}
                  >
                    {gallerySaved[selected.id] ? "Saved ✓" : "Save"}
                  </button>
                  <button onClick={() => setSelected(null)} className="rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                {["Talk to them", "Try their exercise", "Guess their mood", "Share yours"].map((t) => (
                  <button key={t} onClick={() => setSelected(null)} className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-[13.5px] font-medium transition hover:border-teal-300/50 hover:bg-teal-300/10">
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
