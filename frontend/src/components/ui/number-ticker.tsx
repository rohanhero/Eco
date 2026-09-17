"use client";
import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useInView, useTransform, motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Magic UI Number Ticker — fully animated, better quality
export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  decimalPlaces = 0,
  className,
  startValue = 0,
}: {
  value: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
  className?: string;
  startValue?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100, duration: 2 });

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionValue.set(direction === "down" ? startValue : value), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, value, startValue, direction, delay, motionValue]);

  const display = useTransform(spring, (latest) => {
    const fixed = latest.toFixed(decimalPlaces);
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  });

  return (
    <motion.span ref={ref} className={cn("tabular-nums tracking-tighter", className)}>
      <motion.span>{display as any}</motion.span>
    </motion.span>
  );
}
