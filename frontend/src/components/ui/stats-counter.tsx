import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useInView, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// Inspired by Vengence Stats Counter + Animated Number — count-up on scroll
interface StatsCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
  formatter?: (v: number) => string;
}

export function StatsCounter({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
  formatter,
}: StatsCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    damping: 30,
    stiffness: 90,
    duration: duration * 1000,
  });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  const rounded = useTransform(spring, (latest) => {
    if (formatter) return formatter(latest);
    const fixed = latest.toFixed(decimals);
    // add commas
    const parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `${prefix}${parts.join(".")}${suffix}`;
  });

  return (
    <motion.span ref={ref} className={cn("tabular-nums font-semibold", className)}>
      <motion.span>{rounded as any}</motion.span>
    </motion.span>
  );
}

export default StatsCounter;
