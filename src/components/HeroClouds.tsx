"use client";

import Image from "next/image";
import { useRef } from "react";
import { useLenis } from "lenis/react";

export default function HeroClouds() {
  const cloud1Ref = useRef<HTMLDivElement>(null);
  const cloud2Ref = useRef<HTMLDivElement>(null);

  useLenis(({ scroll }) => {
    const x = scroll * 0.22;
    const y = scroll * 0.2;
    if (cloud1Ref.current) {
      cloud1Ref.current.style.transform = `translate(${-x}px, ${-y}px)`;
    }
    if (cloud2Ref.current) {
      cloud2Ref.current.style.transform = `translate(${x}px, ${-y}px)`;
    }
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        ref={cloud1Ref}
        className="absolute -left-45 top-16 w-[70vw] max-w-175 will-change-transform sm:-left-20 sm:top-20 sm:w-[60vw] md:-left-55 md:w-[52vw]"
      >
        <Image
          src="/cloud1.svg"
          alt=""
          width={700}
          height={400}
          className="w-full opacity-95"
          style={{ height: "auto" }}
          priority
        />
      </div>
      <div
        ref={cloud2Ref}
        className="absolute -right-45 top-70 w-[70vw] max-w-[700px] will-change-transform sm:-right-20 sm:top-0 sm:w-[60vw] md:-right-55 md:w-[52vw]"
      >
        <Image
          src="/cloud 2.svg"
          alt=""
          width={700}
          height={400}
          className="w-full opacity-95"
          style={{ height: "auto" }}
          priority
        />
      </div>
    </div>
  );
}
