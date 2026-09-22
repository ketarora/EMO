"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/** Full-screen loader that runs on first load */
export default function PageLoader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#080B12]"
      style={{ pointerEvents: "none" }}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [-8, 8, -8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative h-16 w-16"
        >
          <canvas
            className="h-full w-full rounded-[42%_58%_55%_45%/45%_42%_58%_55%]"
            width={64}
            height={64}
          />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-[13px] text-white/50 font-medium"
        >
          Loading…
        </motion.p>
      </div>
    </motion.div>
  );
}