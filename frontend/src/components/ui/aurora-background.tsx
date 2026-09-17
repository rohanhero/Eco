import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Inspired by Vengence Aurora Hero + Fluid Morph + AnimMaster background animations
export function AuroraBackground({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {/* soft aurora blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full blur-[70px] opacity-30"
        style={{
          background:
            "radial-gradient( circle at 30% 30%, hsl(152 55% 38% / 0.9) 0%, hsl(152 45% 32% / 0.5) 38%, transparent 68% )",
        }}
        animate={{ x: [0, 18, -8, 0], y: [0, -12, 10, 0], scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-24 right-[-80px] w-[560px] h-[480px] rounded-full blur-[72px] opacity-22"
        style={{
          background:
            "radial-gradient( circle at 70% 40%, hsl(145 42% 42% / 0.85) 0%, hsl(140 35% 48% / 0.4) 42%, transparent 70% )",
        }}
        animate={{ x: [0, -14, 10, 0], y: [0, 10, -8, 0], scale: [1, 1.04, 0.99, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
      <motion.div
        className="absolute bottom-[-160px] left-[22%] w-[720px] h-[420px] rounded-full blur-[80px] opacity-18"
        style={{
          background:
            "radial-gradient( ellipse at 50% 50%, hsl(158 50% 26% / 0.7) 0%, transparent 68% )",
        }}
        animate={{ x: [0, 10, -6, 0], y: [0, -8, 6, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      {/* subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100% / 1) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {children}
    </div>
  );
}
