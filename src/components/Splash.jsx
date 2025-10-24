import React from 'react';
import './splash.css';

// Opening: diamond logo with letter K, gold 3D effects
export default function Splash(){
  return (
    <div className="splash splash-genz" aria-label="Opening K diamond gold morph">
      {/* Bubble morph to reveal logo */}
      <div className="intro-mask" aria-hidden />

      <svg className="logo-svg" viewBox="0 0 600 600" role="img" aria-label="K logo">
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4af37" />
            <stop offset="45%" stopColor="#f5d36a" />
            <stop offset="100%" stopColor="#b8860b" />
          </linearGradient>
          <linearGradient id="goldDark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5a4a12" />
            <stop offset="100%" stopColor="#2a2308" />
          </linearGradient>
          <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* subtle bevel via specular lighting */}
          <filter id="bevel" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feSpecularLighting in="blur" surfaceScale="4" specularConstant="0.75" specularExponent="18" lightingColor="#ffffff" result="spec">
              <fePointLight x="-60" y="-40" z="120" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceAlpha" operator="in" result="specOut" />
            <feMerge>
              <feMergeNode in="specOut" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="clipDiamond">
            <rect x="210" y="130" width="180" height="180" rx="10" transform="rotate(45 300 220)" />
          </clipPath>
        </defs>

        {/* Diamond border (draw) */}
        <g className="diamond" transform="translate(300, 220)">
          <rect x="-90" y="-90" width="180" height="180" rx="10" transform="rotate(45)"
                fill="none" stroke="url(#goldGrad)" strokeWidth="14" pathLength="100" className="draw-border" />
          {/* Inner soft gradient fill to add depth */}
          <rect x="-74" y="-74" width="148" height="148" rx="10" transform="rotate(45)"
                fill="url(#goldDark)" opacity="0.28" filter="url(#softGlow)" />
        </g>

        {/* Letter K with extrude and bevel */}
        <g className="symbol" transform="translate(300, 220)" textAnchor="middle" dominantBaseline="middle">
          {/* back extrude layer */}
          <text className="k-back" x="0" y="0" fontFamily="Oxanium, Sora, Inter" fontSize="120" fontWeight="900" fill="url(#goldDark)" transform="translate(3,5)" opacity="0.9">K</text>
          {/* main gold letter */}
          <text className="k-letter" x="0" y="0" fontFamily="Oxanium, Sora, Inter" fontSize="120" fontWeight="900" fill="url(#goldGrad)" filter="url(#bevel)">K</text>
        </g>

        {/* Moving glint clipped to diamond */}
        <g clipPath="url(#clipDiamond)" className="glint-layer" aria-hidden>
          <rect className="glint" x="0" y="0" width="600" height="600" />
        </g>
      </svg>
    </div>
  );
}