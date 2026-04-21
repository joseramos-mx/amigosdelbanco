"use client";
import type { HTMLAttributes } from "react";
import { useInView } from "@/hooks/useInView";

interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  y?: number;
}

export default function Reveal({ children, delay = 0, y = 20, style, className = "", ...rest }: RevealProps) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : `translateY(${y}px)`,
        transition: `opacity 0.65s ease-out ${delay}ms, transform 0.65s ease-out ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
