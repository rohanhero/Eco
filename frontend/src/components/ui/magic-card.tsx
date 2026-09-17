"use client";
import * as React from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";
import { cn } from "@/lib/utils";

// Magic UI Magic Card + Aceternity Spotlight — mouse follows gradient
export function MagicCard({
  children,
  className,
  gradientSize = 200,
  gradientColor = "hsl(152 45% 32% / 0.15)",
  gradientOpacity = 0.9,
}: {
  children: React.ReactNode;
  className?: string;
  gradientSize?: number;
  gradientColor?: string;
  gradientOpacity?: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={cn("group relative flex size-full overflow-hidden rounded-[inherit] bg-card", className)}
    >
      <div className="absolute inset-0 rounded-[inherit] border border-border/60" />
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 80%)`,
          opacity: gradientOpacity,
        }}
      />
      <div className="relative size-full">{children}</div>
    </div>
  );
}
