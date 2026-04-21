"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

interface CarouselTileProps {
  images: { src: string; alt: string }[];
  className?: string;
  style?: React.CSSProperties;
}

export default function CarouselTile({ images, className = "", style }: CarouselTileProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    const id = setInterval(() => setCurrent((p) => (p + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [paused, images.length]);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl ${className}`}
      style={style}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {images.map((img, i) => (
        <Image
          key={i}
          src={img.src}
          alt={img.alt}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className={`object-cover transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Dot indicators */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => { setCurrent(i); setPaused(true); }}
            aria-label={`Foto ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
