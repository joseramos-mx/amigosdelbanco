import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getTotals } from "@/lib/queries";
import { percentOfGoal } from "@/lib/donation";

// Everything under this group shares the site chrome. Routes outside it
// (e.g. /run) render bare on top of the root layout.
export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const totals = await getTotals();
  const goalPercent = percentOfGoal(totals.raised_cents);

  return (
    <SmoothScroll>
      <Navbar goalPercent={goalPercent} />
      {children}
      <Footer />
    </SmoothScroll>
  );
}
