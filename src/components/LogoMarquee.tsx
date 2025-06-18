
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoInfo {
  name: string;
  src: string;
  removeBg?: boolean;
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
              width={150} 
              height={75}
              className={cn(
                "object-contain",
                logo.removeBg && "logo-remove-bg"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoMarquee;
