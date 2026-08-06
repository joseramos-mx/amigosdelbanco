import Hero from "@/components/Hero";
import DonationSteps from "@/components/DonationSteps";
import DonorsSection from "@/components/DonorsSection";
import MissionSection from "@/components/MissionSection";
import CtaSection from "@/components/CtaSection";
import GallerySection from "@/components/GallerySection";
import RunBanner from "@/components/RunBanner";
import { getTotals, getPublicDonors } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [totals, donors] = await Promise.all([getTotals(), getPublicDonors(5)]);

  return (
    <>
      <Hero donorCount={totals.donor_count} />
      <DonationSteps />
      <DonorsSection totals={totals} donors={donors} />
      <MissionSection totals={totals} />
      <CtaSection />
      <GallerySection />
      <RunBanner />
    </>
  );
}
