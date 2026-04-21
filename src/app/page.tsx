import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DonationSteps from "@/components/DonationSteps";
import DonorsSection from "@/components/DonorsSection";
import MissionSection from "@/components/MissionSection";
import CtaSection from "@/components/CtaSection";
import GallerySection from "@/components/GallerySection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar goalPercent={64} />
      <Hero />
      <DonationSteps />
      <DonorsSection />
      <MissionSection />
      <CtaSection />
      <GallerySection />
      <Footer />
    </>
  );
}
