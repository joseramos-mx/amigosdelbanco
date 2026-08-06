import Image from "next/image";
import Link from "next/link";

// Floating promo for the Social Run, pinned to the bottom-right of the home
// page. It sits at z-40 so the fixed navbar (z-50) still wins if they ever
// meet on a short viewport.
//
// The width is capped against the viewport, not just at a fixed size: on a
// narrow phone a 420px pill would hang off the right edge and add a
// horizontal scrollbar to the whole page.
export default function RunBanner() {
  return (
    <Link
      href="/run"
      aria-label="Ver más del Social Run 5 km"
      className="fixed bottom-5 right-5 z-40 flex h-[72px] w-[min(calc(100vw-2.5rem),420px)] overflow-hidden rounded-[20px] shadow-2xl transition-transform hover:-translate-y-0.5 sm:h-[88px]"
    >
      <div className="relative w-[34%] shrink-0 bg-black">
        <Image
          src="/run/quees.webp"
          alt=""
          fill
          sizes="150px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 bg-black px-3 sm:px-4">
        <span className="text-[9px] uppercase tracking-[0.18em] text-white/75 sm:text-[10px]">
          Ver más
        </span>

        <span className="flex items-center gap-2.5 sm:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/run/gglogo.svg"
            alt=""
            className="h-3.5 w-auto shrink-0 sm:h-[18px]"
          />
          <span className="text-[13px] font-bold uppercase leading-none tracking-tight text-white sm:text-[16px]">
            Social Run <span className="font-light">5km</span>
          </span>
        </span>
      </div>
    </Link>
  );
}
