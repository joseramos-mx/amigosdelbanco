import Link from "next/link";

/* ── Static data — wire to Stripe later ────────────────────────────── */
const RAISED = 10_156;
const GOAL = 15_000;
const TOTAL_DONATIONS = 12;

const DONORS = [
  { initials: "C",    name: "Claudia DOMINGUEZ",    amount: 4464, daysAgo: 6 },
  { initials: "J",    name: "Jose F Mere Palafox",  amount: 1000, daysAgo: 6 },
  { initials: null,   name: "Anónimo",              amount: 5000, daysAgo: 6 },
  { initials: "N",    name: "Nueva Casa",           amount: 892,  daysAgo: 6 },
  { initials: null,   name: "Anónimo",              amount: 1000, daysAgo: 6 },
];

const BRANDS = [
  "Hey!", "Flowers & Wine", "Dribbble", "Code/Decode Labs",
  "MINIMAN", "The Gift Seekers", "Kraken", "Visuals Co.",
  "Balance Health", "DETECT", "Proxy", "KONSTRUCT",
  "Inventis", "Wings Co.", "CoDATA", "Avocado",
];

/* ── Donut SVG math ─────────────────────────────────────────────────── */
const R = 42;
const CIRC = 2 * Math.PI * R;
const PROGRESS = Math.min(RAISED / GOAL, 1);
const DASH_OFFSET = CIRC * (1 - PROGRESS);

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US");
}

function AnonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-400" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export default function DonorsSection() {
  return (
    <section className="bg-white px-5 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-[1fr_340px] md:gap-10 lg:grid-cols-[1fr_380px]">

        {/* ── Left — title + brand grid ──────────────────────────────── */}
        <div>
          <h2 className="mb-10 max-w-sm text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
            Agradecemos profundamente<br />a nuestros donantes
          </h2>

          {/* Brand logo grid — replace divs with real <Image> when logos arrive */}
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 sm:gap-6">
            {BRANDS.map((name) => (
              <div
                key={name}
                className="flex h-16 items-center justify-center rounded-xl bg-gray-50 px-3 sm:h-20"
              >
                <span className="text-center text-[11px] font-semibold leading-tight text-gray-400 sm:text-xs">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right — donation scoreboard card ──────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">

          {/* Progress ring + stats */}
          <div className="mb-5 flex items-center gap-4">
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r={R} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                {/* Progress */}
                <circle
                  cx="50" cy="50" r={R}
                  fill="none"
                  stroke="#9ae600"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={DASH_OFFSET}
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm text-gray-500">Se recaudaron</p>
              <p className="text-xl font-bold leading-tight text-gray-900">
                {fmt(RAISED)}{" "}
                <span className="text-base font-normal text-gray-400">
                  de {fmt(GOAL / 1000)}k
                </span>
              </p>
              <p className="mt-0.5 text-sm text-gray-400">
                {TOTAL_DONATIONS} donaciones
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mb-5 flex flex-col gap-2">
            <Link
              href="/donar"
              className="flex w-full items-center justify-center rounded-full bg-brand-lime py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              Donar ahora
            </Link>
            <button className="flex w-full items-center justify-center rounded-full bg-[#1e3a1e] py-3 text-sm font-bold text-brand-lime transition-opacity hover:opacity-90">
              Compartir
            </button>
          </div>

          {/* Donor list */}
          <div className="divide-y divide-gray-100">
            {DONORS.map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                  {d.initials ? d.initials : <AnonIcon />}
                </div>

                {/* Name + time */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{d.name}</p>
                  <p className="text-xs text-gray-400">{d.daysAgo} d</p>
                </div>

                {/* Amount */}
                <span className="shrink-0 text-sm font-semibold text-gray-700">
                  {fmt(d.amount)}
                </span>
              </div>
            ))}
          </div>

          {/* Footer buttons */}
          <div className="mt-4 flex gap-2">
            <Link
              href="/donantes"
              className="flex flex-1 items-center justify-center rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Ver todo
            </Link>
            <Link
              href="/donantes?destacadas=1"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <StarIcon />
              Ver destacadas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
