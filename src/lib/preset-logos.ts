// High quality SVG Data URLs for built-in QR logos
export interface PresetLogo {
  id: string;
  name: string;
  category: string;
  dataUrl: string;
}

export const PRESET_LOGOS: PresetLogo[] = [
  {
    id: 'ai-neural',
    name: 'Neural AI Core',
    category: 'Tech',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" fill="#090d16" stroke="#3b82f6" stroke-width="3"/>
        <circle cx="50" cy="50" r="14" fill="#ec4899"/>
        <circle cx="28" cy="35" r="7" fill="#06b6d4"/>
        <circle cx="72" cy="35" r="7" fill="#06b6d4"/>
        <circle cx="32" cy="70" r="7" fill="#8b5cf6"/>
        <circle cx="68" cy="70" r="7" fill="#8b5cf6"/>
        <line x1="50" y1="50" x2="28" y2="35" stroke="#38bdf8" stroke-width="2.5"/>
        <line x1="50" y1="50" x2="72" y2="35" stroke="#38bdf8" stroke-width="2.5"/>
        <line x1="50" y1="50" x2="32" y2="70" stroke="#a855f7" stroke-width="2.5"/>
        <line x1="50" y1="50" x2="68" y2="70" stroke="#a855f7" stroke-width="2.5"/>
        <line x1="28" y1="35" x2="72" y2="35" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3"/>
      </svg>`
    )}`,
  },
  {
    id: 'dev-summit',
    name: 'Summit Hex',
    category: 'Event',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="#030712" stroke="#ec4899" stroke-width="4"/>
        <polygon points="50,20 80,36 80,64 50,80 20,64 20,36" fill="#1e1b4b" stroke="#38bdf8" stroke-width="2"/>
        <text x="50" y="58" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="#f8fafc" text-anchor="middle">AI</text>
      </svg>`
    )}`,
  },
  {
    id: 'cyber-lock',
    name: 'Cyber Shield',
    category: 'Security',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <path d="M50 10 L85 24 V52 C85 74 50 92 50 92 C50 92 15 74 15 52 V24 Z" fill="#0f172a" stroke="#10b981" stroke-width="4"/>
        <circle cx="50" cy="46" r="10" fill="#10b981"/>
        <path d="M50 56 V68" stroke="#10b981" stroke-width="5" stroke-linecap="round"/>
      </svg>`
    )}`,
  },
  {
    id: 'code-tag',
    name: 'Developer Code',
    category: 'Dev',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <rect width="100" height="100" rx="20" fill="#0f172a"/>
        <path d="M35 32 L18 50 L35 68" stroke="#38bdf8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M65 32 L82 50 L65 68" stroke="#ec4899" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="56" y1="26" x2="44" y2="74" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round"/>
      </svg>`
    )}`,
  },
  {
    id: 'vip-star',
    name: 'VIP Star',
    category: 'Event',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" fill="#1e1b4b" stroke="#eab308" stroke-width="4"/>
        <polygon points="50,18 60,38 82,41 66,57 70,78 50,68 30,78 34,57 18,41 40,38" fill="#eab308"/>
      </svg>`
    )}`,
  },
];
