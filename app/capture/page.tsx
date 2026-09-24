"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { EmoEngine } from "./EmoEngine";
import prompts from "@/lib/emotion-prompts.json";

const ease = [0.22, 1, 0.36, 1] as const;

// Exact constants from the working demo
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/";
const SENTIMENT_WEIGHTS: Record<string, number> = {
  neutral: 0, happy: 3, sad: -6, angry: -2, fearful: -2, disgusted: -2, surprised: 1,
};
const SMOOTHING = 0.06;
const FER_URL =
  "https://cdn.jsdelivr.net/gh/onnx/models@master/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx";
const MOTION_WIDTH = 160;
const DIFF_THRESHOLD = 35;
const MOTION_EMA = 0.25;
const CALIB_SEC = 3.0;
const ROLL_SEC = 8.0;
const FPS_TARGET = 20;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function valLabel(s: number) {
  if (s > 1.5) return "Happy";
  if (s > 0.5) return "Positive";
  if (s < -1.5) return "Sad";
  if (s < -0.5) return "Negative";
  return "Neutral";
}
function arLabel(s: number) {
  if (s > 1.0) return "High";
  if (s < -1.0) return "Low";
  return "Medium";
}

declare global {
  interface Window {
    faceapi: any;
    ort: any;
  }
}

function Slider({
  label, hint, value, display, onChange, accent,
}: {
  label: string; hint: string; value: number; display: string;
  onChange: (v: number) => void; accent: string;
}) {
  return (
    <div>
      <div className="text-[13.5px] font-bold">{label}</div>
      <div className="text-[12px] text-white/40">{hint}</div>
      <div className="mt-2.5 flex items-center gap-3">
        <input
          type="range" min={-3} max={3} step={0.1} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="emo-range flex-1" style={{ ["--accent" as string]: accent }}
          aria-label={label}
        />
        <span className="w-16 text-right text-[13px] font-bold text-white/80">{display}</span>
      </div>
    </div>
  );
}

export default function CapturePage() {
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [valence, setValence] = useState(0);
  const [arousal, setArousal] = useState(0);
  const [status, setStatus] = useState("Loading models…");
  const [prompt, setPrompt] = useState("Focus on your breath and let yourself flow along with the animation.");
  const [saved, setSaved] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EmoEngine | null>(null);
  const runRef = useRef({ running: false, raf: 0, busy: false, stream: null as MediaStream | null });
  const detRef = useRef({
    modelReady: false, fer: null as any, smoothedV: 0,
    off: null as HTMLCanvasElement | null, octx: null as CanvasRenderingContext2D | null,
    prev: null as ImageData | null, lastT: 0, ema: 0, buf: [] as number[], calib: false,
    promptTimer: null as number | null, manualV: false, manualA: false,
  });

  const pushPrompt = useCallback((v: number, a: number) => {
    const key = `v${clamp(Math.round(v), -3, 3)}_a${clamp(Math.round(a), -3, 3)}`;
    const arr = (prompts as Record<string, string[]>)[key];
    if (arr?.length) setPrompt(arr[Math.floor(Math.random() * arr.length)]);
  }, []);

  // Load models directly with better error handling
  useEffect(() => {
    let cancelled = false;
    let loadAttempted = false;
    
    const loadModels = async () => {
      if (loadAttempted) return;
      loadAttempted = true;
      try {
        setStatus("Loading models…");
        const fa = window.faceapi;
        if (!fa) {
          setStatus("face-api.js not loaded");
          return;
        }
        await fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await fa.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await fa.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        if (!cancelled) {
          detRef.current.modelReady = true;
          setStatus("Ready. Click Start.");
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("Model load error:", e);
          setStatus("Model load failed: " + e.message);
        }
      }
    };
    
    // Try to load immediately if faceapi is already available
    if (window.faceapi) {
      loadModels();
    } else {
      // Wait for faceapi to be available
      const checkInterval = setInterval(() => {
        if (window.faceapi) {
          clearInterval(checkInterval);
          loadModels();
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
    
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    const r = runRef.current;
    r.running = false;
    cancelAnimationFrame(r.raf);
    r.stream?.getTracks().forEach((t) => t.stop());
    if (detRef.current.promptTimer) window.clearInterval(detRef.current.promptTimer);
    engineRef.current?.dispose();
    engineRef.current = null;
  }, []);

  const softmax = (arr: number[]) => {
    const m = Math.max(...arr);
    const ex = arr.map((v) => Math.exp(v - m));
    const s = ex.reduce((a, b) => a + b, 0) || 1;
    return ex.map((v) => v / s);
  };

  const loop = useCallback(async () => {
    const r = runRef.current;
    const d = detRef.current;
    if (!r.running) return;
    r.raf = requestAnimationFrame(() => loop());
    if (r.busy) return;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || !video.videoWidth) return;
    r.busy = true;
    try {
      const fa = window.faceapi;
      const disp = { width: video.clientWidth, height: video.clientHeight };
      fa.matchDimensions(overlay, disp);
      const ctx = overlay.getContext("2d");
      ctx?.clearRect(0, 0, overlay.width, overlay.height);
      const res = await fa
        .detectSingleFace(video, new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions();
      if (res) {
        let expr: Record<string, number> | null = null;
        try {
          if (d.fer) {
            if (!d.off) {
              d.off = document.createElement("canvas");
              d.octx = d.off.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
            }
            d.off!.width = 64; d.off!.height = 64;
            const box = res.detection.box;
            d.octx!.drawImage(video, Math.max(0, Math.floor(box.x)), Math.max(0, Math.floor(box.y)),
              Math.max(1, Math.floor(box.width)), Math.max(1, Math.floor(box.height)), 0, 0, 64, 64);
            const px = d.octx!.getImageData(0, 0, 64, 64).data;
            const gray = new Float32Array(64 * 64);
            for (let i = 0, j = 0; i < px.length; i += 4, j++)
              gray[j] = 0.2989 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
            const inName = d.fer.inputNames ? d.fer.inputNames[0] : "Input3";
            const feeds: Record<string, any> = {};
            feeds[inName] = new window.ort.Tensor("float32", gray, [1, 1, 64, 64]);
            const out = await d.fer.run(feeds);
            const outName = d.fer.outputNames ? d.fer.outputNames[0] : Object.keys(out)[0];
            const probs = softmax(Array.from(out[outName].data as Float32Array));
            expr = {
              neutral: probs[0] || 0, happy: probs[1] || 0, surprised: probs[2] || 0,
              sad: probs[3] || 0, angry: probs[4] || 0, disgusted: probs[5] || 0, fearful: probs[6] || 0,
            };
            const contempt = probs[7] || 0;
            expr.angry += 0.5 * contempt;
            expr.disgusted += 0.5 * contempt;
          }
        } catch {}
        if (!expr) expr = fa.resizeResults(res, disp).expressions || {};
        let sum = 0;
        for (const [k, p] of Object.entries(expr || {})) sum += (SENTIMENT_WEIGHTS[k] ?? 0) * (p as number);
        const raw = clamp(sum, -3, 3);
        d.smoothedV = lerp(d.smoothedV, raw, SMOOTHING);
        if (!d.manualV) {
          setValence(d.smoothedV);
          if (engineRef.current) engineRef.current.valence = d.smoothedV;
        }
        if (ctx) {
          const b = fa.resizeResults(res, disp).detection.box;
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 2;
          ctx.strokeRect(b.x, b.y, b.width, b.height);
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.font = "14px ui-sans-serif,system-ui";
          const label = valLabel(d.smoothedV);
          const tw = ctx.measureText(label).width + 14;
          ctx.fillRect(b.x, b.y - 24, tw, 22);
          ctx.fillStyle = "#fff";
          ctx.fillText(label, b.x + 8, b.y - 8);
        }
      } else if (!d.manualV) {
        d.smoothedV = lerp(d.smoothedV, 0, SMOOTHING);
        setValence(d.smoothedV);
        if (engineRef.current) engineRef.current.valence = d.smoothedV;
      }
      // Motion -> arousal
      const now = performance.now();
      if (now - d.lastT >= 1000 / FPS_TARGET && video.videoWidth) {
        d.lastT = now;
        if (!d.off) {
          d.off = document.createElement("canvas");
          d.octx = d.off.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D | null;
        }
        const asp = video.videoHeight ? video.videoWidth / video.videoHeight : 4 / 3;
        d.off!.width = MOTION_WIDTH;
        d.off!.height = Math.round(MOTION_WIDTH / asp);
        d.octx!.drawImage(video, 0, 0, d.off!.width, d.off!.height);
        const frame = d.octx!.getImageData(0, 0, d.off!.width, d.off!.height);
        let energy = 0;
        if (d.prev) {
          const a = frame.data, b = d.prev.data;
          let changed = 0;
          for (let i = 0; i < a.length; i += 4) {
            const g = 0.2989 * Math.abs(a[i] - b[i]) + 0.587 * Math.abs(a[i + 1] - b[i + 1]) + 0.114 * Math.abs(a[i + 2] - b[i + 2]);
            if (g > DIFF_THRESHOLD) changed++;
          }
          energy = clamp(changed / (d.off!.width * d.off!.height), 0, 1);
        }
        d.prev = frame;
        d.ema = lerp(d.ema, energy, MOTION_EMA);
        const maxS = Math.max(10, Math.round(ROLL_SEC * FPS_TARGET));
        d.buf.push(d.ema);
        if (d.buf.length > maxS) d.buf.shift();
        if (!d.calib && d.buf.length >= Math.round(CALIB_SEC * FPS_TARGET)) d.calib = true;
        const sorted = [...d.buf].sort((x, y) => x - y);
        const base = sorted[Math.floor(0.2 * sorted.length)] || 0;
        const hi = sorted[Math.floor(0.95 * sorted.length)] || 1;
        const norm = clamp((d.ema - base) / Math.max(0.05, hi - base), 0, 1);
        const ar = clamp(-3 + norm * 6, -3, 3);
        if (!d.manualA) {
          setArousal(ar);
          if (engineRef.current) engineRef.current.arousal = ar;
        }
      }
    } catch {
      setStatus("Detection error.");
    } finally {
      r.busy = false;
    }
  }, []);

  const handleStart = async () => {
    const r = runRef.current;
    const d = detRef.current;
    if (r.running) return;
    if (!d.modelReady) {
      setStatus("Models still loading…");
      return;
    }
    setSaved(false);
    setDone(false);
    try {
      setStatus("Requesting camera…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false,
      });
      r.stream = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
    } catch (e: any) {
      setStatus("Camera error: " + (e?.message || e?.name));
      return;
    }
    d.smoothedV = 0; d.ema = 0; d.buf = []; d.calib = false; d.prev = null;
    d.manualV = false; d.manualA = false;
    if (stageRef.current && !engineRef.current) {
      try {
        engineRef.current = new EmoEngine(stageRef.current);
      } catch {
        setStatus("WebGL not available.");
        return;
      }
    }
    r.running = true;
    setStarted(true);
    engineRef.current?.start();
    if (d.promptTimer) window.clearInterval(d.promptTimer);
    pushPrompt(0, 0);
    d.promptTimer = window.setInterval(() => {
      pushPrompt(engineRef.current?.valence ?? 0, engineRef.current?.arousal ?? 0);
    }, 5000);
    setStatus("Detecting…");
    loop();
  };

  const handleStop = () => {
    const r = runRef.current;
    const d = detRef.current;
    r.running = false;
    cancelAnimationFrame(r.raf);
    if (d.promptTimer) window.clearInterval(d.promptTimer);
    d.promptTimer = null;
    r.stream?.getTracks().forEach((t) => t.stop());
    r.stream = null;
    overlayRef.current?.getContext("2d")?.clearRect(0, 0, 9999, 9999);
    engineRef.current?.halt();
    setStarted(false);
    setDone(false);
    setValence(0);
    setArousal(0);
    setPrompt("Stopped. Click Start.");
    setStatus(d.modelReady ? "Stopped. Click Start." : "Stopped.");
  };

  const handleFinish = () => {
    if (videoRef.current) {
      const v = videoRef.current;
      const hc = document.createElement("canvas");
      hc.width = v.videoWidth;
      hc.height = v.videoHeight;
      const hcCtx = hc.getContext("2d");
      if (hcCtx) {
        hcCtx.drawImage(v, 0, 0, hc.width, hc.height);
        setPhotoData(hc.toDataURL("image/jpeg", 0.9));
      }
    }
    runRef.current.running = false;
    cancelAnimationFrame(runRef.current.raf);
    if (detRef.current.promptTimer) window.clearInterval(detRef.current.promptTimer);
    runRef.current.stream?.getTracks().forEach((t) => t.stop());
    runRef.current.stream = null;
    setDone(true);
  };

  const handleBack = () => {
    setDone(false);
    handleStop();
  };

  const handleShareReport = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#080B12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glCanvas = stageRef.current?.querySelector("canvas");
    if (glCanvas) {
      ctx.drawImage(glCanvas, 0, 0, 1080, 1080);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, "rgba(8,11,18,0)");
    grad.addColorStop(0.7, "rgba(8,11,18,0.85)");
    grad.addColorStop(1, "rgba(8,11,18,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Today's EMO", 540, 680);

    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.fillStyle = "#22d3ee";
    ctx.fillText(`Valence: ${valence.toFixed(1)}`, 340, 760);
    ctx.fillStyle = "#c084fc";
    ctx.fillText(`Energy: ${arousal.toFixed(1)}`, 740, 760);

    if (photoData) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(540, 900, 110, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 430, 790, 220, 220);
        ctx.restore();

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(540, 900, 110, 0, Math.PI * 2);
        ctx.stroke();

        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `emo-report-${new Date().toISOString().split("T")[0]}.png`;
        a.click();
      };
      img.src = photoData;
    } else {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `emo-report-${new Date().toISOString().split("T")[0]}.png`;
      a.click();
    }
  };

  const handleSave = async () => {
    try {
      const record = { date: new Date().toISOString(), valence: Math.round(clamp(valence, -3, 3)), energy: Math.round(clamp(arousal, -3, 3)) };
      const savedArr = JSON.parse(localStorage.getItem("emo_checkins") || "[]");
      savedArr.push(record);
      localStorage.setItem("emo_checkins", JSON.stringify(savedArr));

      const canvas = stageRef.current?.querySelector("canvas");
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `emo-mood-${new Date().toISOString().split("T")[0]}.png`;
        a.click();
      }
    } catch {}
    setSaved(true);
  };

  return (
    <main className="relative overflow-hidden">
      <Script src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/dist/face-api.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/ort.min.js" strategy="afterInteractive" onLoad={() => { if (window.ort) window.ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.0/dist/"; }} />

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <svg className="absolute left-1/2 top-[-30px] h-[380px] w-[1400px] -translate-x-1/2 opacity-40" viewBox="0 0 1400 380" fill="none">
          <path d="M-20 120 C 320 120, 450 20, 700 20 S 1100 120, 1420 260" stroke="#1e3a5f" strokeWidth="1.5" />
        </svg>
        <div className="absolute -right-40 top-[-100px] h-[360px] w-[360px] rounded-full bg-purple-600/25 blur-[130px]" />
        <div className="absolute -left-48 bottom-[-80px] h-[420px] w-[420px] rounded-full bg-blue-700/25 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-[928px] px-5 pb-20 pt-8">
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="font-display text-[28px] font-bold tracking-tight">
          Let&apos;s see where you are.
        </motion.h1>
        <p className="mt-1.5 max-w-[640px] text-[14px] text-white/55">
          Look into the camera for a moment, or set it yourself below. Press Start to see the next state, right
          below this one.
        </p>

        <div className={`mt-5 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#070c18] ${done ? "" : "grid md:grid-cols-[320px_1fr]"}`}>
          <AnimatePresence initial={false}>
            {!done && (
              <motion.aside key="panel" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: "easeOut" }} className="border-b border-white/[0.07] p-5 md:border-b-0 md:border-r">
                <div className="relative flex h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0a1122]">
                  <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                  <canvas ref={overlayRef} className="absolute inset-0 h-full w-full" />
                  {!started && (
                    <p className="relative px-8 text-center text-[12px] leading-relaxed text-white/70">
                      Your camera will appear here
                      <br />
                      once you press Start
                    </p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <button onClick={handleStart} disabled={!detRef.current.modelReady} className="rounded-full border border-white/15 bg-white/[0.07] py-2.5 text-[13.5px] font-semibold transition hover:bg-white/[0.14] disabled:opacity-50">
                    Start
                  </button>
                  <button onClick={handleStop} className="rounded-full border border-white/15 bg-white/[0.07] py-2.5 text-[13.5px] font-semibold transition hover:bg-white/[0.14]">
                    Stop
                  </button>
                </div>

                <div className="mt-5 space-y-5">
                  <Slider label="How pleasant does this feel?" hint="Try smiling to see this change" value={valence} display={`${valence.toFixed(1)} · ${valLabel(valence)}`} accent="linear-gradient(90deg,#a855f7,#22d3ee)"
                    onChange={(v) => { detRef.current.manualV = true; setValence(v); if (engineRef.current) engineRef.current.valence = v; }} />
                  <Slider label="How much energy is behind it?" hint="Move your hands a little to see this change" value={arousal} display={`${arousal.toFixed(1)} · ${arLabel(arousal)}`} accent="linear-gradient(90deg,#a855f7,#2dd4bf)"
                    onChange={(v) => { detRef.current.manualA = true; setArousal(v); if (engineRef.current) engineRef.current.arousal = v; }} />
                </div>

                <p className="mt-3 min-h-[20px] text-[12px] text-teal-200/90">{prompt}</p>

                <div className="grain-soft relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1020] p-5 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5">
                    <Lock className="h-5 w-5 text-sky-300" />
                  </div>
                  <div className="mt-3 text-[13px] font-bold leading-snug">
                    Upgrade to unlock
                    <br />
                    <span className="bg-gradient-to-r from-teal-200 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">the graph</span>
                  </div>
                  <p className="mx-auto mt-2 max-w-[220px] text-[11.5px] leading-snug text-white/50">
                    Track your valence &amp; energy trajectory across all daily check-ins.
                  </p>
                  <button className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-full bg-gradient-to-r from-teal-300 to-blue-500 py-2.5 text-[13px] font-bold text-black transition hover:opacity-90">
                    Unlock at day 30 <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          <div className="relative min-h-[calc(100vh-140px)] flex-1 overflow-hidden">
            <div ref={stageRef} className="absolute inset-0 [&>canvas]:h-full [&>canvas]:w-full" />
            <AnimatePresence mode="wait">
              {!started && !done && (
                <motion.div key="idle" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeOut" }} className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <h2 className="text-[26px] font-extrabold">Waiting for you to start!</h2>
                  <p className="mt-2 max-w-[460px] text-[14px] text-white/55">
                    Focus on your breath and let yourself flow along with the animation.
                  </p>
                  <p className="mt-3 text-[12px] text-white/35">{status}</p>
                </motion.div>
              )}
              {started && !done && (
                <motion.button key="finish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleFinish} className="absolute right-4 top-4 rounded-full border border-white/15 bg-black/50 px-5 py-2 text-[13px] font-semibold backdrop-blur transition hover:bg-white/10">
                  Finish →
                </motion.button>
              )}
              {done && (
                <motion.div key="done" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 px-8 text-center">
                  <button onClick={handleBack} className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15" aria-label="Back to controls">›</button>
                  <h2 className="text-[26px] font-extrabold drop-shadow-[0_2px_18px_rgba(0,0,0,0.7)]">Good, let this stay with you!</h2>
                  <p className="mt-2 max-w-[480px] text-[14px] text-white/70">
                    Focus on your breath and let yourself flow along with the animation.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link href="/talk-exercises" onClick={() => handleSave()} className="rounded-full bg-gradient-to-r from-teal-300 to-blue-500 px-6 py-3 text-[14px] font-bold text-black shadow-[0_10px_40px_-10px_rgba(45,212,191,0.7)] transition hover:opacity-90">
                      Done! let&apos;s talk with EMO
                    </Link>
                    <Link href="/community" onClick={() => handleSave()} className="rounded-full border border-white/10 bg-black/50 px-6 py-3 text-[14px] font-semibold text-white/80 backdrop-blur transition hover:bg-white/10">
                      Proceed
                    </Link>
                    <button onClick={handleShareReport} className="rounded-full border border-teal-300/40 bg-teal-400/10 px-6 py-3 text-[14px] font-bold text-teal-200 backdrop-blur transition hover:bg-teal-400/20">
                      Share Report Card
                    </button>
                  </div>
                  {saved && <p className="mt-3 text-[12.5px] text-teal-200">Valence {valence.toFixed(1)} · Energy {arousal.toFixed(1)} saved locally & downloaded.</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {done && (
          <div className="mt-4 grid gap-2.5 rounded-2xl border border-white/[0.08] bg-[#070c18] p-4 sm:grid-cols-2 md:hidden">
            <Slider label="Pleasant?" hint="Try smiling" value={valence} display={valLabel(valence)} accent="linear-gradient(90deg,#a855f7,#22d3ee)" onChange={(v) => { setValence(v); if (engineRef.current) engineRef.current.valence = v; }} />
            <Slider label="Energy?" hint="Move hands" value={arousal} display={arLabel(arousal)} accent="linear-gradient(90deg,#a855f7,#2dd4bf)" onChange={(v) => { setArousal(v); if (engineRef.current) engineRef.current.arousal = v; }} />
          </div>
        )}
      </div>

      <style jsx global>{`
        .emo-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 999px; background: var(--accent, linear-gradient(90deg, #a855f7, #22d3ee)); outline: none; }
        .emo-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #fff; border: 3px solid #0b1226; box-shadow: 0 0 0 2px rgba(255,255,255,0.35), 0 4px 14px rgba(0,0,0,0.5); cursor: pointer; }
        .emo-range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid #0b1226; cursor: pointer; }
      `}</style>
    </main>
  );
}
