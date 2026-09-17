import * as React from "react";
import { cn } from "@/lib/utils";

// Inspired by Vengence Glow Border Card — animated gradient border on hover
export function GlowCard({
  className,
  children,
  glowColors = ["hsl(152 55% 32%)", "hsl(148 42% 40%)", "hsl(142 36% 46%)"],
  duration = 3.5,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  glowColors?: string[];
  duration?: number;
}) {
  return (
    <div
      className={cn("relative rounded-[16px] p-[1px] overflow-hidden group", className)}
      style={
        {
          "--glow-dur": `${duration}s`,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* gradient border */}
      <div
        className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from 0deg, ${glowColors.join(", ")}, ${glowColors[0]})`,
          animation: "glow-rotate var(--glow-dur) linear infinite",
        }}
      />
      {/* mask inner */}
      <div className="absolute inset-[1px] rounded-[15px] bg-card" />
      {/* content */}
      <div className="relative rounded-[15px] bg-card h-full">{children}</div>
    </div>
  );
}
