
'use client';

import React from 'react';
import Image from 'next/image';

interface LogoInfo {
  name: string;
  src: string;
}

interface LogoMarqueeProps {
  logos: LogoInfo[];
  speed?: string; // e.g., '20s', '30s', '40s'
}

const LogoMarquee: React.FC<LogoMarqueeProps> = ({ logos, speed = '40s' }) => {
  // Duplicate logos for seamless scroll effect
  const extendedLogos = [...logos, ...logos];

  return (
    <div className="marquee-container">
      <div
        className="marquee-content"
        style={{ animationDuration: speed }}
      >
        {extendedLogos.map((logo, index) => (
          <div key={`${logo.name}-${index}`} className="marquee-item">
            <Image
              src={logo.src}
              alt={logo.name}
              fill
              style={{ objectFit: 'contain' }} // Removed padding from here
              sizes="112px" // Updated to reflect .marquee-item width (w-28)
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoMarquee;
