"use client";

import { useEffect, useRef } from "react";

type Stage = "idle" | "live" | "done";

/** Full-panel particle field. Density/glow reacts to valence + energy. */
export default function ParticleStage({
  stage,
  valence,
  energy,
}: {
  stage: Stage;
  valence: number;
  energy: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; s: number; o: number; hue: number };
    const N = 1400;
    const parts: P[] = Array.from({ length: N }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      s: 0.4 + Math.random() * 1.6,
      o: 0.2 + Math.random() * 0.8,
      hue: 160 + Math.random() * 60,
    }));

    const t0 = performance.now();
    const render = (t: number) => {
      const time = (t - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      // base vignette glow
      const cx = w / 2;
      const cy = h / 2;
      const intensity = stage === "idle" ? 0.25 : stage === "live" ? 0.6 : 1;
      const breathe = 1 + Math.sin(time * 0.8) * 0.05;

      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.max(w, h) * 0.55 * breathe);
      // valence shifts teal->gold, energy boosts brightness
      const warm = Math.max(0, valence / 3); // 0..1 pleasant
      const r = Math.round(20 + warm * 40 + energy * 4);
      const gg = Math.round(60 + warm * 40 + energy * 6);
      const b = Math.round(80 - warm * 20);
      g.addColorStop(0, `rgba(${r},${gg},${b},${0.35 * intensity})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // particles drift toward center cloud when done
      const pull = stage === "done" ? 0.35 : stage === "live" ? 0.12 : 0.02;
      const jitter = 0.3 + energy * 0.15 + (stage === "live" ? 0.6 : 0);
      for (const p of parts) {
        p.x += p.vx * (1 + jitter) + Math.sin(time * 0.6 + p.y * 10) * 0.00012 * (1 + jitter);
        p.y += p.vy * (1 + jitter) + Math.cos(time * 0.5 + p.x * 10) * 0.00012 * (1 + jitter);
        // gentle pull to center for cloud shape
        p.x += (0.5 - p.x) * 0.0006 * pull;
        p.y += (0.5 - p.y) * 0.0006 * pull;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const dx = p.x - 0.5;
        const dy = (p.y - 0.5) * (h / w);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vis = Math.max(0, 1 - dist * 2.2) * intensity;
        if (vis <= 0.02) continue;
        const tw = 0.5 + 0.5 * Math.sin(time * 1.8 + p.x * 20 + p.y * 17);
        // pleasant = teal/gold tint, unpleasant = cooler dim
        const pr = Math.round(140 + warm * 100 * tw);
        const pg = Math.round(220 + warm * 20);
        const pb = Math.round(210 - warm * 60);
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${(p.o * vis * (0.4 + tw * 0.6)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.s, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [stage, valence, energy]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
