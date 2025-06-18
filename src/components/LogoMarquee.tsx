
'use client';

import React from 'react';

interface LogoMarqueeProps {
  logos: string[];
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
        {extendedLogos.map((logoText, index) => (
          <div key={index} className="marquee-item">
            {/* For actual logos, you would use <Image /> here */}
            <span>{logoText}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogoMarquee;
