"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { EmoEngine } from "../capture/EmoEngine";

/** Big 3D particle orb — mouse reactive, deep blue glow, professional look. */
export default function Orb3D({ size = 340, valence, energy }: { size?: number, valence?: number, energy?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EmoEngine | null>(null);
  const [failed, setFailed] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    engineRef.current?.setMouse(nx, ny);
  }, []);

  const handleLeave = useCallback(() => {
    engineRef.current?.setMouse(null, null);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let engine: EmoEngine | null = null;
    let raf = 0;
    const t0 = performance.now();
    try {
      engine = new EmoEngine(el, 55000);
      engineRef.current = engine;
      if (valence !== undefined && energy !== undefined) {
        engine.valence = valence;
        engine.arousal = energy;
        engine.start();
      } else {
        // Default floating blue orb for Home Page
        engine.valence = -1.2;
        engine.arousal = -0.5;
        engine.overrideColorA = "#22d3ee";
        engine.overrideColorB = "#0ea5e9";
        const drift = () => {
          const t = (performance.now() - t0) / 1000;
          if (engine) {
            engine.valence = -1.2 + Math.sin(t * 0.25) * 0.45;
            engine.arousal = -0.5 + Math.sin(t * 0.18 + 1) * 0.4;
          }
          raf = requestAnimationFrame(drift);
        };
        engine.start();
        raf = requestAnimationFrame(drift);
      }
    } catch {
      setFailed(true);
    }
    return () => {
      cancelAnimationFrame(raf);
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  if (failed) {
    return (
      <div className="relative overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image src="/figma-home/v21_5795.png" alt="emo orb" fill className="object-cover" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      className="hero-orb-wrap relative cursor-pointer"
      style={{ width: size, height: size }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {/* Outer pulsing glow layers */}
      <div className="hero-orb-glow absolute inset-[-30%] rounded-full" />
      <div className="hero-orb-glow-inner absolute inset-[-15%] rounded-full" />
      {/* 3D particle container */}
      <div
        ref={ref}
        className="relative overflow-hidden rounded-full [&>canvas]:h-full [&>canvas]:w-full"
        style={{
          width: size,
          height: size,
        }}
      />
    </motion.div>
  );
}
