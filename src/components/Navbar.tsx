"use client";

import Link from "next/link";
import { useState } from "react";

interface NavbarProps {
  goalPercent?: number;
}

const NAV_LINKS = [
  { href: "/",              label: "Inicio" },
  { href: "/quienes-somos", label: "Quiénes Somos" },
  { href: "/donantes",      label: "Donantes" },
  { href: "/galeria",       label: "Galería" },
];

function CircularProgress({ percent }: { percent: number }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black/15 backdrop-blur-sm">
      <svg width="44" height="44" viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke="#9ae600"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="relative text-[10px] font-bold text-white">{percent}%</span>
    </div>
  );
}

export default function Navbar({ goalPercent = 64 }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 sm:px-6">

      {/* ── Main bar ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 sm:justify-center sm:gap-10">

        {/* Left: circular ring (mobile) / linear pill (desktop) */}
        <div className="sm:hidden">
          <CircularProgress percent={goalPercent} />
        </div>
        <div className="relative hidden h-11 min-w-[160px] overflow-hidden rounded-full bg-black/10 backdrop-blur-2xl sm:flex">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-brand-lime transition-all duration-700"
            style={{ width: `${goalPercent}%` }}
          />
          <span className="relative z-10 flex h-full w-full items-center justify-center px-2 text-xs text-[#070707]">
            Objetivo al {goalPercent}%
          </span>
        </div>

        {/* Center pill */}
        <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-2 py-1.5 shadow-md sm:flex-none sm:gap-6 sm:px-6 sm:py-2.5">

          {/* Hamburger — inside pill on mobile + small tablet */}
          <button
            onClick={() => setMenuOpen((p) => !p)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-[#3d1a00] transition-opacity hover:opacity-90 md:hidden"
          >
            {menuOpen ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            ) : (
              <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1h13M1 5.5h13M1 10h13" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 select-none items-center" onClick={() => setMenuOpen(false)}>
            <img src="logo.svg" alt="Banco de Alimentos Durango" className="w-14 px-1 sm:w-20 sm:p-2 sm:px-4" />
          </Link>

          {/* Nav links — desktop only */}
          <div className="hidden items-center gap-5 text-sm font-medium text-gray-600 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="transition-colors hover:text-brand-blue">
                {label}
              </Link>
            ))}
          </div>

          {/* Donar ahora — inside pill on mobile only */}
          <Link
            href="/donar"
            className="ml-auto shrink-0 rounded-full bg-brand-yellow px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 sm:hidden"
          >
            Donar ahora
          </Link>
        </div>

        {/* Right: account icon (always) + donar ahora (desktop only) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/cuenta"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-sm transition-colors hover:bg-brand-yellow"
            aria-label="Mi cuenta"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Donar ahora — outside pill on desktop only */}
          <Link
            href="/donar"
            className="hidden rounded-full bg-brand-yellow px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 sm:flex sm:px-6"
          >
            Donar ahora
          </Link>
        </div>
      </div>

      {/* ── Mobile dropdown ─────────────────────────────────────────── */}
      <div
        className={`absolute left-4 right-4 top-full mt-2 overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-200 ease-out md:hidden ${
          menuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        <div className="divide-y divide-gray-100 py-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-4 text-center text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

    </nav>
  );
}
