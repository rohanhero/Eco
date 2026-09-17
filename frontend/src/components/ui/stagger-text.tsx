import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Inspired by Vengence UI Stagger Text — word/letter reveal
interface StaggerTextProps {
  children: React.ReactNode;
  divideBy?: "word" | "letter";
  className?: string;
  delay?: number;
  stagger?: number;
  as?: "h1" | "h2" | "p" | "span" | "div";
}

export function StaggerText({
  children,
  divideBy = "word",
  className,
  delay = 0,
  stagger = 0.06,
  as = "div",
}: StaggerTextProps) {
  const text = typeof children === "string" ? children : String(children ?? "");
  const parts = divideBy === "letter" ? text.split("") : text.split(" ");

  const Comp: any = motion[as] ?? motion.div;

  return (
    <Comp
      className={cn("inline-flex flex-wrap", className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      aria-label={text}
    >
      {parts.map((part, i) => (
        <motion.span
          key={`${part}-${i}`}
          className={cn(
            "inline-block will-change-transform",
            divideBy === "letter" ? "" : "mr-[0.24em] last:mr-0"
          )}
          variants={{
            hidden: { y: "110%", opacity: 0, rotateX: -18 },
            visible: {
              y: "0%",
              opacity: 1,
              rotateX: 0,
              transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] },
            },
          }}
          style={{ transformOrigin: "bottom" }}
        >
          {part === " " ? "\u00A0" : part}
        </motion.span>
      ))}
    </Comp>
  );
}

export default StaggerText;
