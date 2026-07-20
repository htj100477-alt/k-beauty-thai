'use client';

import React, { useState } from 'react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
  className?: string;
}

export default function SafeImage({ src, alt, className, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isBroken = error || !src || src.trim() === '' || src.includes('placeholder');

  return (
    <div className="relative w-full h-full bg-slate-50 flex items-center justify-center rounded-inherit overflow-hidden">
      {isBroken ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-3 select-none">
          {/* Beautiful cosmetic/leaf placeholder icon */}
          <div className="w-10 h-10 rounded-full bg-slate-100/80 border border-slate-200/60 flex items-center justify-center mb-1.5 shadow-sm text-lg">
            🌿
          </div>
          <span className="text-[9px] font-semibold text-slate-500 text-center line-clamp-2 px-2 leading-snug">
            {alt}
          </span>
        </div>
      ) : (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center animate-pulse">
              <span className="text-xl text-slate-300">🌿</span>
            </div>
          )}
          <img
            src={src}
            alt={alt}
            className={`${className || ''} ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-300`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            {...props}
          />
        </>
      )}
    </div>
  );
}
