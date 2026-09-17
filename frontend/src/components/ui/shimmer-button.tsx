"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

// Magic UI Shimmer Button — fully animated perimeter shimmer
export function ShimmerButton({
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  shimmerDuration = "3s",
  borderRadius = "100px",
  background = "linear-gradient(135deg, hsl(155 62% 21%) 0%, hsl(152 48% 32%) 100%)",
  className,
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      style={
        {
          "--spread": "90deg",
          "--shimmer-color": shimmerColor,
          "--radius": borderRadius,
          "--speed": shimmerDuration,
          "--cut": shimmerSize,
          "--bg": background,
        } as React.CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] dark:text-black",
        "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
        className
      )}
      {...props}
    >
      <div className="absolute -inset-[10px] [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5))_at_50%_50%,var(--shimmer-color)_0deg,var(--shimmer-color)_calc(var(--spread)*0.5),transparent_calc(var(--spread)*0.5),transparent_360deg)] [border-radius:var(--radius)] [mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)] [mask-composite:exclude] p-[var(--cut)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-0 -z-10 [background:var(--bg)] [border-radius:var(--radius)]" />
      <span className="relative flex items-center gap-2 text-sm font-semibold tracking-tight">{children}</span>
    </button>
  );
}
