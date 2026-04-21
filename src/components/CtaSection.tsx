"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";

const MEALS_SERVED = 421_321;

function useCountUp(target: number, inView: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3; // ease-out cubic
      setCount(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView]);
  return count;
}

export default function CtaSection() {
  const [ref, inView] = useInView(0.25);
  const count = useCountUp(MEALS_SERVED, inView);

  return (
    <section className="bg-white px-5 pb-16 sm:px-6 sm:pb-20">
      <div
        ref={ref}
        className="mx-auto max-w-5xl rounded-3xl bg-brand-yellow px-8 py-14 text-center sm:px-14 sm:py-16"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "none" : "translateY(24px)",
          transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
        }}
      >
        <h2 className="text-2xl font-semibold leading-tight text-[#451703] sm:text-3xl md:text-4xl">
          Nuestra misión va de la mano<br />con nuestros valores
        </h2>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#451703]/65 sm:text-base">
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
          nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat
          volutpat. Ut wisi enim ad minim
        </p>

        <p className="mt-8 text-5xl font-extrabold tracking-tight text-[#451703] sm:text-7xl md:text-9xl">
          {count.toLocaleString("en-US")}+
        </p>

        <div className="mt-10">
          <Link
            href="/donar"
            className="inline-flex rounded-full bg-white px-8 py-3 text-sm font-bold text-[#451703] shadow-sm transition-opacity hover:opacity-80 sm:text-base"
          >
            Donar ahora
          </Link>
        </div>
      </div>
    </section>
  );
}
