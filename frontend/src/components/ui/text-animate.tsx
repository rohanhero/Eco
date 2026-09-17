"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Animation = "fadeIn" | "blurIn" | "blurInUp" | "slideUp" | "scaleUp" | "slideLeft";
type By = "text" | "word" | "character" | "line";

const variants: Record<Animation, any> = {
  fadeIn: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  blurIn: { hidden: { opacity: 0, filter: "blur(10px)" }, show: { opacity: 1, filter: "blur(0px)" } },
  blurInUp: { hidden: { opacity: 0, filter: "blur(10px)", y: 20 }, show: { opacity: 1, filter: "blur(0px)", y: 0 } },
  slideUp: { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } },
  scaleUp: { hidden: { scale: 0.9, opacity: 0 }, show: { scale: 1, opacity: 1 } },
  slideLeft: { hidden: { x: 20, opacity: 0 }, show: { x: 0, opacity: 1 } },
};

// Magic UI Text Animate — by character/word with spring control
export function TextAnimate({
  children,
  className,
  segmentClassName,
  delay = 0,
  duration = 0.5,
  by = "word",
  animation = "blurInUp",
  as: Component = "p",
  once = true,
  startOnView = true,
}: {
  children: string;
  className?: string;
  segmentClassName?: string;
  delay?: number;
  duration?: number;
  by?: By;
  animation?: Animation;
  as?: any;
  once?: boolean;
  startOnView?: boolean;
}) {
  const text = children || "";
  let segments: string[] = [];
  if (by === "word") segments = text.split(" ");
  else if (by === "character") segments = text.split("");
  else if (by === "line") segments = text.split("\n");
  else segments = [text];

  const Comp: any = motion[Component] || motion.p;

  return (
    <Comp
      className={cn("flex flex-wrap", className)}
      initial="hidden"
      whileInView={startOnView ? "show" : undefined}
      animate={!startOnView ? "show" : undefined}
      viewport={{ once, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: delay } } }}
    >
      {segments.map((seg, i) => (
        <motion.span
          key={`${seg}-${i}`}
          className={cn("inline-block will-change-transform", by === "word" ? "mr-[0.25em]" : "", segmentClassName)}
          variants={variants[animation]}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        >
          {seg === " " ? "\u00A0" : seg}
        </motion.span>
      ))}
    </Comp>
  );
}
