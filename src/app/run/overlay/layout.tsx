import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Overlay",
  robots: { index: false, follow: false },
};

// Fondo transparente para que OBS/vMix puedan componer el overlay sobre el video.
export default function OverlayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`html,body{background:transparent!important;overflow:hidden}`}</style>
      {children}
    </>
  );
}
