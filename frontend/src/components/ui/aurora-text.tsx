"use client";
import { cn } from "@/lib/utils";

interface AuroraTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  colors?: string[];
  speed?: number;
}

// Magic UI Aurora Text — vivid, clearly visible on white nav
export function AuroraText({ children, className, colors = ["#10b981", "#06b6d4", "#22c55e", "#14b8a6"], speed = 1, ...props }: AuroraTextProps) {
  return (
    <span
      className={cn("relative inline-block", className)}
      style={
        {
          "--aurora-speed": `${6 / speed}s`,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="relative z-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 bg-clip-text text-transparent animate-aurora bg-[length:300%_auto] [filter:drop-shadow(0_0_6px_rgba(16,185,129,0.35))]">
        {children}
      </span>
      <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-cyan-400 to-green-500 bg-clip-text text-transparent blur-[8px] animate-aurora bg-[length:300%_auto] opacity-70">
        {children}
      </span>
      <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 bg-clip-text text-transparent blur-[16px] animate-aurora bg-[length:300%_auto] opacity-25">
        {children}
      </span>
    </span>
  );
}
