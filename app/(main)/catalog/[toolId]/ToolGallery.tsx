"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-bg-surface border border-primary-100 rounded-2xl flex items-center justify-center text-primary-200">
        <Sprout className="w-16 h-16" aria-hidden />
      </div>
    );
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[4/3] bg-bg-surface rounded-2xl overflow-hidden border border-primary-100">
        <Image
          src={images[index]}
          alt={`${name} – תמונה ${index + 1}`}
          fill
          sizes="(max-width: 480px) 100vw, 480px"
          className="object-cover"
          priority={index === 0}
          unoptimized
        />
        {images.length > 1 && (
          <>
            {/* RTL: "previous" = forward arrow on right */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="תמונה קודמת"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-bg-surface/80 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center shadow"
            >
              <ChevronRight className="w-5 h-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="תמונה הבאה"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-bg-surface/80 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center shadow"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4">
          {images.map((src, i) => (
            <li key={src + i} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`עבור לתמונה ${i + 1}`}
                className={cn(
                  "relative w-14 h-14 rounded-lg overflow-hidden border-2",
                  i === index ? "border-primary" : "border-transparent"
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
