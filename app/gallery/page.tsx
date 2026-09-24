"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Heart } from "lucide-react";

type Post = {
  id: string;
  name: string;
  dot: string;
  quote: string;
  art: string;
};

// Re-importing same posts pool for matching IDs
const posts: Post[] = [
  { id: "ishaan", name: "Ishaan", dot: "bg-teal-300", quote: "Got through the presentation.", art: "radial-gradient(circle at 50% 50%, #115e59 0%, #064e3b 100%)" },
  { id: "priya", name: "Priya", dot: "bg-purple-400", quote: "Finally taking a break.", art: "radial-gradient(circle at 40% 40%, #6b21a8 0%, #3b0764 100%)" },
  { id: "karan", name: "Karan", dot: "bg-amber-300", quote: "Morning run clear.", art: "radial-gradient(circle at 60% 40%, #b45309 0%, #78350f 100%)" },
  { id: "sneha", name: "Sneha", dot: "bg-blue-300", quote: "Feeling overwhelmed today.", art: "radial-gradient(circle at 30% 60%, #1e3a8a 0%, #0f172a 100%)" },
  { id: "rahul", name: "Rahul", dot: "bg-rose-400", quote: "Just existing today.", art: "radial-gradient(circle at 70% 30%, #be123c 0%, #4c0519 100%)" },
  { id: "ananya", name: "Ananya", dot: "bg-emerald-300", quote: "Productive morning!", art: "radial-gradient(circle at 50% 50%, #047857 0%, #064e3b 100%)" },
  { id: "main", name: "Alex (Featured)", dot: "bg-teal-400", quote: "Seems like a good day.", art: "radial-gradient(circle at 50% 50%, #0d9488 0%, #042f2e 100%)" },
];

function Art({ art, className = "" }: { art: string; className?: string }) {
  return (
    <div className={`grain-soft relative overflow-hidden ${className}`} style={{ background: art }}>
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.5)_0.6px,transparent_0.7px)] [background-size:14px_14px]" />
    </div>
  );
}

export default function GalleryPage() {
  const [saved, setSaved] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const g = localStorage.getItem("emo_gallery");
      const savedIds: Record<string, boolean> = g ? JSON.parse(g) : {};
      
      const m = localStorage.getItem("emo_main_saved");
      if (m === "true") savedIds["main"] = true;

      const mySaved = posts.filter(p => savedIds[p.id]);
      setSaved(mySaved);
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
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-[28px] font-bold tracking-tight">
          Your Gallery
        </motion.h1>
        <p className="mt-1.5 max-w-[620px] text-[14px] text-white/55">
          A personal collection of the check-ins that resonated with you.
        </p>

        {saved.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-[14px] text-white/40">You haven&apos;t saved anything to your gallery yet.</p>
            <Link href="/community" className="mt-4 inline-block rounded-full bg-white/10 px-6 py-2.5 text-[13px] font-semibold transition hover:bg-white/20">
              Explore Community
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 xl:grid-cols-3">
            {saved.map((p, i) => (
              <motion.article
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1226]"
              >
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
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
