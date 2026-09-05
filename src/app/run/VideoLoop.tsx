"use client";

import { useState, useRef, useEffect } from "react";

type Clip = {
  videoSrc: string;
  autor: string;
};

export default function VideoLoop({ clips }: { clips: Clip[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentIndex]);

  const handleEnded = () => {
    setCurrentIndex((prev) => (prev + 1) % clips.length);
  };

  if (!clips.length) return null;

  const currentClip = clips[currentIndex];

  return (
    <div className="group relative aspect-[9/16] w-full overflow-hidden rounded-[20px] bg-black">
      <video
        ref={videoRef}
        src={currentClip.videoSrc}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/5" />
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
        <span className="font-geist text-sm font-semibold text-white">
          {currentClip.autor}
        </span>
      </div>
    </div>
  );
}
