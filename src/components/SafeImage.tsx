'use client';

import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
}

export default function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);

  const isBroken = error || !src || src.trim() === '' || src.includes('placeholder');

  return (
    <div className="relative w-full h-full bg-slate-50 flex items-center justify-center rounded-inherit overflow-hidden">
      {isBroken ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-slate-50 to-[#f1f5f9] text-slate-400 select-none">
          {/* Cosmetic/leaf placeholder icon */}
          <span className="text-2xl mb-1 filter drop-shadow-sm opacity-80">🌿</span>
          <span className="text-[8px] font-bold text-slate-400/80 tracking-widest uppercase mt-0.5">
            K-Beauty
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="async"
          className={className || ''}
          onError={() => setError(true)}
          {...props}
        />
      )}
    </div>
  );
}
