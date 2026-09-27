'use client';

import React from 'react';

const TECH_ITEMS = [
  'LARAVEL',
  'REACT 19',
  'TYPESCRIPT',
  'TAILWIND CSS',
  'REDIS CLUSTER',
  'NEXT.JS 16',
  'POSTGRESQL',
  'DOCKER / K8S',
  'APACHE KAFKA',
  'GO RUNTIME',
  'GRAPHQL APIS',
  'RUST KERNEL',
  'ZERO-BLUR SHADOWS',
  '300 DPI RASTER',
];

export function MarqueeBanner() {
  return (
    <div className="w-full bg-[#ccff00] border-y-2 border-black overflow-hidden py-3 select-none">
      <div className="animate-marquee flex items-center">
        {/* Repeated twice to ensure continuous smooth loop */}
        {[...TECH_ITEMS, ...TECH_ITEMS, ...TECH_ITEMS].map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center shrink-0">
            <span className="font-mono text-sm sm:text-base font-black tracking-widest text-black px-4 whitespace-nowrap">
              {item}
            </span>
            <span className="w-2.5 h-2.5 bg-black rotate-45 transform shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
