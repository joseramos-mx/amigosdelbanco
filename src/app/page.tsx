import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DonationSteps from "@/components/DonationSteps";
import DonorsSection from "@/components/DonorsSection";
import MissionSection from "@/components/MissionSection";

export default function Home() {
  return (
    <>
      <Navbar goalPercent={64} />
      <Hero />
      <DonationSteps />
      <DonorsSection />
      <MissionSection />
    </>
  );
}
