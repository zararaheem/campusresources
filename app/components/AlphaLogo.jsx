'use client';

import { useState } from 'react';

// Uses the uploaded brand logo at /public/alpha-logo.svg when present, and
// falls back to a built-in faceted "digital hummingbird" mark + ALPHA wordmark
// otherwise. To use the official logo, drop the file at public/alpha-logo.svg
// (it sits on a navy background, so a white / light version reads best).
export default function AlphaLogo({ size = 30, className = '' }) {
  const [useImg, setUseImg] = useState(true);

  if (useImg) {
    return (
      <span className={`alpha-logo ${className}`} aria-label="Alpha">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/alpha-logo.svg"
          alt="Alpha"
          className="alpha-logo-img"
          style={{ height: size, width: 'auto' }}
          onError={() => setUseImg(false)}
        />
      </span>
    );
  }

  return (
    <span className={`alpha-logo ${className}`} aria-label="Alpha">
      <svg width={size * 1.35} height={size} viewBox="0 0 54 40" fill="currentColor" aria-hidden>
        {/* scattered pixels — the dissolving wing */}
        <rect x="0" y="6" width="4" height="4" opacity="0.45" />
        <rect x="7" y="1" width="4" height="4" opacity="0.7" />
        <rect x="6" y="10" width="4" height="4" opacity="0.85" />
        <rect x="13" y="6" width="4" height="4" />
        {/* body + wing + beak, faceted */}
        <polygon points="18,10 34,16 22,20" />
        <polygon points="22,20 34,16 30,27" />
        <polygon points="34,16 52,9 36,19" />
        <polygon points="22,20 30,27 20,31" />
      </svg>
      <span className="alpha-word">ALPHA</span>
    </span>
  );
}
