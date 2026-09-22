"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function Orb({ size = 220 }: { size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ 
    x: 0.5, y: 0.5, inside: false, lastX: 0.5, lastY: 0.5
  });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    const native = "nativeEvent" in e ? e.nativeEvent : e as MouseEvent;
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const newX = (native.clientX - rect.left) / rect.width;
    const newY = (native.clientY - rect.top) / rect.height;
    
    mouseRef.current.x = newX;
    mouseRef.current.y = newY;
    mouseRef.current.inside = true;
  }, []);

  const handleLeave = useCallback(() => {
    mouseRef.current.inside = false;
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Spread keeps canvas larger than the boundary box
    const SPREAD = 2.5; 
    const canvasSize = size * SPREAD;
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    const ballR = size * 0.45;

    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    type P = { 
      x: number; y: number;
      vx: number; vy: number;
      s: number; o: number; sp: number;
      chaos: number;
      hue: number;
    };
    
    const N = 800; // Dense particle feel
    
    const spawnParticle = (): P => {
      // Start in the heart of the core
      const radius = ballR * (0.3 + Math.random() * 0.7);
      const angle = Math.random() * Math.PI * 2;
      return {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        s: 0.5 + Math.random() * 1.5,
        o: 0.25 + Math.random() * 0.5,
        sp: 0.03 + Math.random() * 0.2,
        chaos: Math.random(),
        hue: 180 + Math.random() * 40, // Cyan mapping
      };
    };

    const parts: P[] = Array.from({ length: N }, spawnParticle);

    let raf = 0;
    const t0 = performance.now();

    const render = (t: number) => {
      const time = (t - t0) / 1000;
      const breathe = 1 + Math.sin(time * 0.65) * 0.05;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.globalCompositeOperation = "source-over";

      // Draw the core glowing ball (Solid teal/cyan exactly as intended by original image)
      const ballGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ballR * breathe);
      ballGrad.addColorStop(0, "#22d3ee");    
      ballGrad.addColorStop(0.35, "#06b6d4"); 
      ballGrad.addColorStop(0.65, "#0891b2"); 
      ballGrad.addColorStop(1, "#164e63");    // Solid edge to form the circle shape
      
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, ballR * breathe, 0, Math.PI * 2);
      ctx.fill();

      // Inner glow rings
      for (let i = 3; i > 0; i--) {
        const ringR = ballR * breathe * (0.25 + i * 0.22);
        const ringG = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringR);
        ringG.addColorStop(0, `rgba(34, 211, 238, ${0.04 * i})`);
        ringG.addColorStop(1, "rgba(34, 211, 238, 0)");
        ctx.fillStyle = ringG;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "screen"; // Particles glowing blend

      // Get mouse state and calculate actual frame delta to restore hover interaction!
      const m = mouseRef.current;
      const deltaMx = m.x - m.lastX;
      const deltaMy = m.y - m.lastY;
      m.lastX = m.x;
      m.lastY = m.y; // store for next frame
      
      const frameSpeed = Math.hypot(deltaMx, deltaMy) * 150; // Calibrated for 60fps delta
      const windSpeed = m.inside ? Math.min(frameSpeed * 3, 2.5) : 0;
      
      const windOriginX = m.inside ? cx - (size / 2) + m.x * size : cx;
      const windOriginY = m.inside ? cy - (size / 2) + m.y * size : cy;

      // Ensure wind Angle handles 0 delta gracefully
      let windAngle = 0;
      if (deltaMx !== 0 || deltaMy !== 0) {
        windAngle = Math.atan2(deltaMy, deltaMx);
      }

      // Update and draw particles
      for (let i = 0; i < parts.length; i++) {
        let p = parts[i];
        
        // Brownian wander (native)
        const wanderX = Math.sin(time * 0.5 + p.chaos * 13) * 0.0015;
        const wanderY = Math.cos(time * 0.4 + p.chaos * 9) * 0.0015;
        
        const dx = p.x - cx;
        const dy = p.y - cy;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Orbit
        const orbitForce = 0.00008 / Math.max(distFromCenter, 10);
        const orbitX = -dy * orbitForce;
        const orbitY = dx * orbitForce;
        
        // INCREASED OUTWARD DRIFT! This is what will make them fly organically!
        // The closer they are, the harder they get pushed, so they explode slowly from the core.
        const outwardForce = 0.0006 * (1 + p.chaos); 
        const outX = (dx / Math.max(distFromCenter, 1)) * outwardForce;
        const outY = (dy / Math.max(distFromCenter, 1)) * outwardForce;

        p.vx += wanderX + orbitX + outX;
        p.vy += wanderY + orbitY + outY;

        // Mouse interaction restored!
        if (m.inside && windSpeed > 0) {
          const mdx = windOriginX - p.x;
          const mdy = windOriginY - p.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          const maxMDist = size * 1.2;
          
          if (mdist < maxMDist && mdist > 1) {
            const influence = (1 - mdist / maxMDist) * windSpeed * 0.035;
            
            p.vx += Math.cos(windAngle) * influence;
            p.vy += Math.sin(windAngle) * influence;
            
            p.vx += (mdx / mdist) * influence * 0.4;
            p.vy += (mdy / mdist) * influence * 0.4;
          }
        }

        // Original Velocity damping
        p.vx *= 0.992;
        p.vy *= 0.992;

        p.x += p.vx * 12;
        p.y += p.vy * 12;

        // Natural Fade out Logic
        const fadeStart = canvasSize * 0.25; 
        const fadeEnd = canvasSize * 0.45; 
        let distFade = 1;
        
        if (distFromCenter > fadeStart) {
          distFade = Math.max(0, 1 - (distFromCenter - fadeStart) / (fadeEnd - fadeStart));
        }

        if (distFromCenter > fadeEnd || distFade <= 0.005) {
          parts[i] = spawnParticle();
          p = parts[i];
          continue; 
        }

        // Visuals
        const ptBreathe = 1 + Math.sin(time * 0.6 + p.chaos * 2) * 0.035;
        const pulse = 1 + Math.sin(time * 1.1 + p.chaos * 4) * 0.15;
        const tw = 0.4 + 0.6 * Math.sin(time * 1.4 + p.chaos * 7);
        const hueShift = p.hue + 15 * Math.sin(time * 0.08 + p.chaos * 4);
        const finalOpacity = (p.o * distFade * (0.35 + 0.55 * tw)).toFixed(3);
        
        ctx.fillStyle = `hsla(${hueShift}, 85%, ${50 + 15 * tw}%, ${finalOpacity})`;
        
        const renderSize = Math.max(0.5, p.s * ptBreathe * pulse + tw * 0.5);
        ctx.beginPath();
        ctx.arc(p.x, p.y, renderSize, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over"; // Reset for outer graphics

      // Outer rings
      const ringBreathe = 1 + Math.sin(time * 0.65) * 0.05;
      const ringGrad = ctx.createRadialGradient(cx, cy, ballR * breathe * 0.95, cx, cy, ballR * breathe * 1.05);
      ringGrad.addColorStop(0, "rgba(34, 211, 238, 0)");
      ringGrad.addColorStop(0.5, `rgba(34, 211, 238, ${0.55 * ringBreathe})`);
      ringGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, ballR * breathe * ringBreathe, 0, Math.PI * 2);
      ctx.stroke();

      // Glow aura
      ctx.shadowColor = "rgba(34, 211, 238, 0.65)";
      ctx.shadowBlur = 55;
      const auraGrad = ctx.createRadialGradient(cx, cy, ballR * breathe * 1.1, cx, cy, ballR * breathe * 1.5);
      auraGrad.addColorStop(0, `rgba(34, 211, 238, ${0.35 * ringBreathe})`);
      auraGrad.addColorStop(1, "rgba(34, 211, 238, 0)");
      ctx.strokeStyle = auraGrad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, ballR * breathe * 1.2 * ringBreathe, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    
    raf = requestAnimationFrame(render);

    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative cursor-pointer flex items-center justify-center pointer-events-auto"
      style={{ width: size, height: size }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <canvas
        ref={ref}
        className="absolute pointer-events-none"
        style={{ 
          width: size * 2.5, 
          height: size * 2.5, 
          maxWidth: "none", 
          maxHeight: "none",
          left: `-${(size * 2.5 - size) / 2}px`,
          top: `-${(size * 2.5 - size) / 2}px`,
          zIndex: 0
        }}
      />
    </motion.div>
  );
}