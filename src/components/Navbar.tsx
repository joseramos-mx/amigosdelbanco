"use client";

import Link from "next/link";

interface NavbarProps {
  goalPercent?: number;
}

export default function Navbar({ goalPercent = 64 }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-10 px-4 py-3 sm:px-6">
      {/* Goal progress pill — hidden on mobile */}
      <div className="relative hidden h-11 min-w-[160px] overflow-hidden rounded-full bg-black/10 sm:flex backdrop-blur-2xl">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-brand-lime transition-all duration-700"
          style={{ width: `${goalPercent}%` }}
        />
        <span className="relative z-10 flex h-full w-full items-center justify-center px-2 text-xs text-[#070707]">
          Objetivo al {goalPercent}%
        </span>
      </div>

      {/* Center pill — logo + nav links */}
      <div className="flex items-center gap-4 rounded-full bg-white px-4 py-2.5 shadow-md sm:gap-6 sm:px-6">
        <Link href="/" className="flex select-none items-center gap-1">
          <img src="logo.svg" alt="" className="w-20 p-2 px-4"/>
        </Link>

        <div className="hidden items-center gap-5 text-sm font-medium text-gray-600 md:flex">
          <Link href="/" className="transition-colors hover:text-brand-blue">Inicio</Link>
          <Link href="/quienes-somos" className="transition-colors hover:text-brand-blue">Quiénes Somos</Link>
          <Link href="/donantes" className="transition-colors hover:text-brand-blue">Donantes</Link>
          <Link href="/galeria" className="transition-colors hover:text-brand-blue">Galería</Link>
        </div>
      </div>

      {/* Right — account icon + donate CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Account icon — hidden on mobile */}
        <Link
          href="/cuenta"
          className="hidden h-11 w-11 items-center justify-center rounded-full bg-black/10 text-white transition-colors hover:bg-brand-yellow sm:flex"
          aria-label="Mi cuenta"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>

        <Link
          href="/donar"
          className="rounded-full bg-brand-yellow px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:px-6"
        >
          Donar ahora
        </Link>
      </div>
    </nav>
  );
}
