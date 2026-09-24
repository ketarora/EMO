"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Heart, X } from "lucide-react";

import { Post, posts, getGradient } from "../data/posts";

function Art({ art, className = "" }: { art: string; className?: string }) {
  return (
    <div className={`grain-soft relative overflow-hidden ${className}`} style={{ background: art }}>
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.5)_0.6px,transparent_0.7px)] [background-size:14px_14px]" />
    </div>
  );
}


type Checkin = { date: string; valence: number; energy: number; image?: string };

export default function GalleryPage() {
  const [tab, setTab] = useState<"personal" | "community">("personal");
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [myCheckins, setMyCheckins] = useState<Checkin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedCapture, setSelectedCapture] = useState<Checkin | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleDelete = () => {
    if (!selectedCapture) return;
    const next = myCheckins.filter(c => c !== selectedCapture);
    setMyCheckins(next);
    localStorage.setItem("emo_checkins", JSON.stringify(next));
    setSelectedCapture(null);
  };

  useEffect(() => {
    try {
      // 1. Load community saves
      const g = localStorage.getItem("emo_gallery");
      const savedIds: Record<string, boolean> = g ? JSON.parse(g) : {};
      const m = localStorage.getItem("emo_main_saved");
      if (m === "true") savedIds["main"] = true;
      setSavedPosts(posts.filter((p) => savedIds[p.id]));

      // 2. Load personal captures
      const c = localStorage.getItem("emo_checkins");
      if (c) setMyCheckins(JSON.parse(c));
    } catch {}
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  return (
    <main className="relative min-h-[calc(100vh-68px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-48 bottom-[-60px] h-[420px] w-[420px] rounded-full bg-blue-700/12 blur-[140px]" />
        <div className="absolute -right-40 top-[-100px] h-[360px] w-[360px] rounded-full bg-purple-600/12 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-[928px] px-5 pb-20 pt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-[28px] font-bold tracking-tight">
              Your Gallery
            </motion.h1>
            <p className="mt-1.5 max-w-[620px] text-[14px] text-white/55">
              A personal collection of the check-ins that resonated with you.
            </p>
          </div>
          <div>
            <input 
              type="file" 
              id="mock-upload"
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const r = new FileReader();
                  r.onload = (ev) => {
                    const res = ev.target?.result as string;
                    if (res) {
                      const arr = JSON.parse(localStorage.getItem("emo_checkins") || "[]");
                      arr.push({ date: new Date().toISOString(), valence: 1, energy: -1, image: res });
                      localStorage.setItem("emo_checkins", JSON.stringify(arr));
                      window.location.reload(); 
                    }
                  };
                  r.readAsDataURL(f);
                }
              }} 
            />
            <label htmlFor="mock-upload" className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold transition hover:bg-white/10">
              + Add Capture
            </label>
          </div>
        </div>
        
        <div className="mt-5 flex gap-2 border-b border-white/10 pb-1">
          <button onClick={() => setTab("personal")} className={`px-4 py-2 text-[14px] font-semibold transition ${tab === "personal" ? "text-teal-300 border-b-2 border-teal-300" : "text-white/40 hover:text-white"}`}>
            My Captures
          </button>
          <button onClick={() => setTab("community")} className={`px-4 py-2 text-[14px] font-semibold transition ${tab === "community" ? "text-teal-300 border-b-2 border-teal-300" : "text-white/40 hover:text-white"}`}>
            Saved 
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "personal" ? (
            <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-8">
              {myCheckins.length === 0 ? (
                <div className="mt-12 text-center">
                  <p className="text-[14px] text-white/40">You haven&apos;t done your daily check-in yet.</p>
                  <Link href="/capture" className="mt-4 inline-block rounded-full bg-gradient-to-r from-teal-300 to-blue-500 px-6 py-2.5 text-[13px] font-bold text-black transition hover:opacity-90">
                    Go to Capture
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {myCheckins.slice().reverse().map((c, i) => (
                    <article key={i} onClick={() => { setSelectedCapture(c); setShowAnalysis(false); }} className="cursor-pointer overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1226] p-4 shadow-lg transition hover:bg-[#111c38]">
                      {c.image ? (
                        <div className="h-[140px] rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${c.image})` }} />
                      ) : (
                        <Art art={getGradient(c.valence, c.energy)} className="h-[140px] rounded-xl" />
                      )}
                      <div className="mt-4 flex items-center justify-between text-[12px] opacity-70">
                        <span className="font-semibold">{new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="mt-1.5 flex gap-2">
                        <span className="rounded bg-teal-400/10 px-2 py-0.5 text-[10.5px] text-teal-200">Valence {c.valence}</span>
                        <span className="rounded bg-fuchsia-400/10 px-2 py-0.5 text-[10.5px] text-fuchsia-200">Energy {c.energy}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="community" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-8">
              {savedPosts.length === 0 ? (
                <div className="mt-12 text-center">
                  <p className="text-[14px] text-white/40">You haven&apos;t saved any community posts yet.</p>
                  <Link href="/community" className="mt-4 inline-block rounded-full bg-white/10 px-6 py-2.5 text-[13px] font-semibold transition hover:bg-white/20">
                    Explore Community
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {savedPosts.map((p) => (
                    <article key={p.id} className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1226] shadow-lg">
                      <div className="relative">
                        <Art art={p.art} className="h-[190px]" />
                        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur">
                          <Heart className="h-4 w-4 fill-rose-400 text-rose-400" />
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="min-h-[42px] text-[13.5px] leading-snug text-white/85">“{p.quote}”</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`h-5 w-5 rounded-full ${p.dot} shadow-[0_0_14px_rgba(45,212,191,0.6)]`} />
                          <span className="text-[12.5px] text-white/50">{p.name}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedCapture && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-5 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-[420px] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[24px] border border-white/10 bg-[#0d142b] shadow-2xl custom-scrollbar"
              >
                <button
                  onClick={() => setSelectedCapture(null)}
                  className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/60 backdrop-blur transition hover:bg-black/60 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>

                {selectedCapture.image ? (
                  <img src={selectedCapture.image} alt="Capture Report" className="w-full h-auto object-cover" />
                ) : (
                  <Art art={getGradient(selectedCapture.valence, selectedCapture.energy)} className="h-[300px] w-full" />
                )}

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-400/20 text-[10px]">✨</span>
                    <h3 className="text-[16px] font-bold text-teal-300">EMO AI Insights</h3>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                    Based on your telemetry, you were experiencing a state of {selectedCapture.valence > 0 ? "elevated" : "lowered"} equilibrium. Your energy (arousal) was mapped at {(Math.abs((selectedCapture.energy / 3)) * 100).toFixed(0)}% of your typical peak.
                  </p>
                  
                  <AnimatePresence>
                    {showAnalysis && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden rounded-xl bg-teal-500/10 p-4 border border-teal-500/20">
                        <p className="text-[12.5px] leading-relaxed text-teal-100/90">
                          Detailed breakdown: Markers indicate high resonance. The captured state points toward an optimal alignment for deep cognitive reflection. Consider utilizing this period to draft journaling thoughts or solve systemic problems, which align well with this emotional state.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button onClick={() => setShowAnalysis(!showAnalysis)} className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-[12.5px] font-semibold transition hover:bg-white/10 text-white/90">
                      {showAnalysis ? "Hide Analysis" : "Analyze Day"}
                    </button>
                    <button onClick={handleDelete} className="rounded-xl border border-rose-500/20 bg-rose-500/10 py-2.5 text-[12.5px] font-semibold transition hover:bg-rose-500/20 text-rose-300">
                      Delete Capture
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
