"use client";
import Image from "next/image";
import Link from "next/link";
import { useInView } from "@/hooks/useInView";

// Swap this path to use a different image for the CTA banner.
const CTA_IMAGE_SRC = "/gallery/img4.jpeg";
const CTA_IMAGE_ALT = "Banco de Alimentos Durango entregando alimento a la comunidad";

export default function CtaSection() {
  const [ref, inView] = useInView(0.25);

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

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#451703]/70 sm:text-base">
          Gracias a quienes creen en esta causa, hemos llevado alimento a miles
          de hogares duranguenses.
        </p>

        <div className="mx-auto mt-8 w-full max-w-2xl">
          <div className="relative aspect-video overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={CTA_IMAGE_SRC}
              alt={CTA_IMAGE_ALT}
              fill
              sizes="(max-width: 768px) 90vw, 700px"
              className="object-cover"
            />
          </div>
        </div>

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
