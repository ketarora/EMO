"use client";

import { useState, useEffect } from "react";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Orb3D from "./components/Orb3D";
import { ArrowRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.7, ease },
};

const F = "/figma-home";

const moodCards = [
  { title: "Light", sub: "Things feel okay right now.", cls: "from-[#4de8e0] via-[#38bdf8] to-[#818cf8]", art: `${F}/v21_5814.png`, href: "/capture" },
  { title: "Heavy", sub: "Something's sitting on you.", cls: "from-[#c084fc] via-[#e879f9] to-[#f9a8d4]", art: `${F}/v21_5821.png`, href: "/capture" },
  { title: "Not sure", sub: "Let's find out together.", cls: "from-[#fbbf24] via-[#fb923c] to-[#fda4af]", art: `${F}/v21_5828.png`, href: "/capture" },
];

// Exact Figma stills per logged day (DOM order from the figma-to-html export)
const dayArt: Record<number, string[]> = {
  2: [`${F}/v21_5927.png`, `${F}/v21_5928.png`],
  3: [`${F}/v21_5932.png`],
  5: [`${F}/v21_5936.png`, `${F}/v21_5937.png`],
  6: [`${F}/v21_5941.png`, `${F}/v21_5942.png`],
  8: [`${F}/v21_5914.png`, `${F}/v21_5915.png`],
  9: [`${F}/v21_5946.png`],
  11: [`${F}/v21_5950.png`],
  14: [`${F}/v21_5870.png`, `${F}/v21_5871.png`],
  15: [`${F}/v21_5923.png`],
  17: [`${F}/v21_5954.png`],
  18: [`${F}/v21_5958.png`],
  21: [`${F}/v21_5883.png`],
};
const loggedDays = new Set(Object.keys(dayArt).map(Number));

export default function Home() {
  const [currentDate, setCurrentDate] = useState({ month: "September", day: 21, daysInMonth: 30, offset: 0 });

  useEffect(() => {
    const d = new Date();
    const month = d.toLocaleString("default", { month: "long" });
    const day = d.getDate();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    const offset = (firstDay + 6) % 7; // Monday-based
    setCurrentDate({ month, day, daysInMonth, offset });
  }, []);

  return (
    <main className="relative overflow-hidden bg-[#080B12]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg className="absolute left-1/2 top-[-40px] h-[560px] w-[1600px] -translate-x-1/2 opacity-40" viewBox="0 0 1600 560" fill="none">
          <path d="M-40 140 C 300 140, 420 10, 800 10 S 1300 140, 1660 420" stroke="#1e3a5f" strokeWidth="1.5" />
          <path d="M-40 470 C 350 470, 500 330, 820 330 S 1250 430, 1660 480" stroke="#3b2a5e" strokeWidth="1" opacity="0.7" />
        </svg>
        <div className="absolute -right-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-purple-600/25 blur-[130px]" />
        <div className="absolute right-[8%] top-[280px] h-[380px] w-[380px] rounded-full bg-teal-500/15 blur-[130px]" />
        <div className="absolute -left-48 top-[520px] h-[460px] w-[460px] rounded-full bg-blue-700/25 blur-[140px]" />
        {/* Orbiting glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-[80px]"
          style={{ background: "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.6) 0%, rgba(16,185,129,0.4) 40%, transparent 70%)" }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full opacity-15 blur-[60px]"
          style={{ background: "radial-gradient(circle at 70% 70%, rgba(16,185,129,0.5) 0%, rgba(34,211,238,0.3) 50%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[928px] px-5 pb-24">
        {/* HERO — big blue orb with particles */}
        <section className="flex flex-col items-center pt-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease }}
            className="relative flex items-center justify-center"
            style={{ height: 220, width: 220 }}
          >
            <Orb3D size={220} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease }}
            className="mt-5 inline-flex h-8 items-center gap-2 rounded-full border border-white/5 bg-[#5fe3d3]/[0.08] px-4 text-[13px] text-[#5fe3d3]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#5fe3d3] shadow-[0_0_10px_rgba(95,227,211,1)]" />
            A pedometer for mental health
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
            className="text-balance mt-5 max-w-[706px] font-display text-[40px] font-semibold leading-[1.1] tracking-tight text-[#f1f4fa] sm:text-[54px]"
          >
            Notice how you feel, before it becomes too much.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 max-w-[534px] text-[16px] leading-relaxed text-[#9aa6bc]"
          >
            EMO isn&apos;t here to fix everything. It&apos;s here for you to take a break and breath!
          </motion.p>

          <div className="mt-7 grid w-full max-w-[820px] grid-cols-1 gap-4 sm:grid-cols-3">
            {moodCards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.45 + i * 0.1, ease }}
              >
                <Link
                  href={c.href}
                  className={`group relative block min-h-[120px] overflow-hidden rounded-[24px] bg-gradient-to-br ${c.cls} p-[18px] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_-12px_rgba(56,189,248,0.45)] focus-visible:outline-2 focus-visible:outline-teal-300 active:translate-y-0 active:scale-[0.99]`}
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <div className="absolute -right-[70px] -top-[80px] h-[288px] w-[277px] -rotate-[59deg] opacity-90 mix-blend-screen transition-transform duration-500 group-hover:rotate-[-54deg] group-hover:scale-105">
                    <Image src={c.art} alt="" fill className="object-cover" />
                  </div>
                  <div className="relative font-display text-[21px] font-bold leading-tight text-[#0b0e16]">{c.title}</div>
                  <div className="relative mt-1 text-[13px] text-[#0a0e16]/75">{c.sub}</div>
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 max-w-[646px] text-[13px] leading-relaxed text-[#5c6679]">
            There&apos;s no wrong answer, this just helps us guide you. Picking one scrolls you straight down to
            Capture, below.
          </p>
        </section>

        {/* CALENDAR — dynamic date */}
        <motion.section {...fadeUp} className="mt-12 rounded-[28px] border border-white/[0.06] bg-[#111826] p-[26px]">
          <h2 className="font-display text-[19px] font-bold text-[#f1f4fa]">Your {currentDate.month} will also look like this!</h2>
          <p className="mt-1 text-[13px] text-white/60">
            Each logged day holds a still from that day&apos;s check-in - tap one to look back.
          </p>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="pb-1 text-center text-[16px] font-semibold text-[#5c6679]">
                {d}
              </div>
            ))}
            {Array.from({ length: Math.max(0, currentDate.offset) }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: currentDate.daysInMonth }, (_, i) => i + 1).map((n) => {
              const today = n === currentDate.day;
              const arts = dayArt[n] || (today && !dayArt[currentDate.day] ? dayArt[21] : undefined);
              return (
                <motion.button
                  key={n}
                  onClick={() => { window.location.href = "/capture"; }}
                  initial={{ opacity: 0, scale: 0.94 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={
                    today
                      ? "group relative aspect-square overflow-hidden rounded-[9px] border-2 border-teal-300/90 bg-[#0b1119] focus-visible:outline-2 focus-visible:outline-teal-300"
                      : arts
                        ? "group relative aspect-square overflow-hidden rounded-[9px] border border-white/5 bg-[#0b1119] transition-all duration-300 hover:scale-[1.04] hover:border-white/20 focus-visible:outline-2 focus-visible:outline-teal-300 active:scale-[0.98]"
                        : "relative aspect-square rounded-[9px] bg-black/40 transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-teal-300"
                  }
                >
                  {arts?.map((src, k) => (
                    <Image key={k} src={src} alt="" fill sizes="120px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ))}
                  <span className={`absolute inset-0 flex items-center justify-center text-[30px] font-semibold ${loggedDays.has(n) ? "text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]" : "text-[#5c6679]"}`}>
                    {n}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* BANNERS — exact Figma glow stills */}
        <motion.section {...fadeUp} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/talk-exercises"
            className="group relative min-h-[110px] overflow-hidden rounded-[22px] bg-gradient-to-r from-[#a855f7] via-[#e879f9] to-[#f9a8d4] p-5 text-black transition-all duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-white active:translate-y-0"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <div className="absolute -right-[60px] -top-[90px] h-[288px] w-[277px] -rotate-[59deg] opacity-80 mix-blend-screen">
              <Image src={`${F}/v21_5972.png`} alt="" fill className="object-cover" />
            </div>
            <div className="relative font-display text-[19px] font-bold leading-tight text-[#05001a]">Talk &amp; Exercises</div>
            <div className="relative mt-1 max-w-[340px] text-[13px] text-[#05001a]/80">
              A guided reset, or someone to talk it through with.
            </div>
            <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[#05001a] transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
          <Link
            href="/community"
            className="group relative min-h-[110px] overflow-hidden rounded-[22px] bg-gradient-to-r from-[#34d399] via-[#2dd4bf] to-[#38bdf8] p-5 text-black transition-all duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-white active:translate-y-0"
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <div className="absolute -right-[60px] -top-[90px] h-[288px] w-[277px] -rotate-[59deg] opacity-80 mix-blend-screen">
              <Image src={`${F}/v21_5982.png`} alt="" fill className="object-cover" />
            </div>
            <div className="relative font-display text-[19px] font-bold leading-tight text-[#05001a]">Community</div>
            <div className="relative mt-1 max-w-[340px] text-[13px] text-[#05001a]/80">
              See who else is feeling this, right now.
            </div>
            <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-[#05001a] transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
        </motion.section>

        {/* PRICING — exact Figma type scale */}
        <motion.section {...fadeUp} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { name: "On-screen", price: "₹0", tag: "Current", desc: "Everything you need to build the habit.", feats: ["Unlimited check-ins", "Community & exercises", "AI Ally, 20 min/day"], cta: "You're here", active: true },
            { name: "Hybrid — the Ball", price: "₹499", tag: "", desc: "A physical companion that tracks passively.", feats: ["Everything in On-screen", "Screen-free passive tracking", "Syncs when you check in"], cta: "Unlocks at day 30", active: false, highlight: true },
            { name: "Fully Offline", price: "₹1,499", tag: "", desc: "For when you're ready to leave the screen behind.", feats: ["Dedicated offline device", "Concierge onboarding", "Priority professional access"], cta: "Notify me", active: false },
          ].map((p) => (
            <div key={p.name} className={`rounded-[26px] border p-[26px] transition-colors ${p.active ? "border-teal-300/40 bg-gradient-to-b from-[#5fe3d3]/10 to-[#111826]" : "border-white/[0.07] bg-[#111826]/60 hover:border-white/[0.14]"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-display text-[18px] font-bold text-[#f1f4fa]">{p.name}</div>
                {p.tag && (
                  <span className="rounded-full border border-[#5fe3d3]/25 bg-[#5fe3d3]/[0.08] px-2.5 py-0.5 text-[10px] text-[#5fe3d3]">
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-[30px] font-bold text-[#f1f4fa]">{p.price}</span>
                <span className="text-[13px] font-medium text-[#5c6679]">/month</span>
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/75">{p.desc}</p>
              <ul className="mt-4 space-y-2 text-[12px] text-white/75">
                {p.feats.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="font-bold text-[#5fe3d3]">+</span> {f}
                  </li>
                ))}
              </ul>
              <button className={p.highlight ? "mt-5 w-full rounded-full bg-gradient-to-r from-teal-300 to-blue-500 py-2.5 text-[13px] font-bold text-black transition hover:brightness-110 active:scale-[0.99]" : "mt-5 w-full rounded-full border border-white/10 py-2.5 text-[13px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.99]"}>
                {p.cta}
              </button>
            </div>
          ))}
        </motion.section>

        <footer className="mt-14 border-t border-dashed border-white/10 pt-6 text-center text-[12px] text-[#5c6679]">
          emo — a pedometer for mental health. Take a break and breath.
        </footer>
      </div>
    </main>
  );
}
