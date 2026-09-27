// High-resolution photographic & artistic presets for Whole-Image Photo QR Codes
export interface PhotoPreset {
  id: string;
  name: string;
  subtitle: string;
  category: 'Portrait' | 'Tech' | 'Architecture' | 'Art';
  description: string;
  dataUrl: string;
}

export const PHOTO_PRESETS: PhotoPreset[] = [
  {
    id: 'bw-portrait-photo',
    name: 'B/W Portrait Photograph',
    subtitle: 'Studio Monochrome Portrait',
    category: 'Portrait',
    description: 'High-contrast studio portrait with balanced facial highlights and deep shadows.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#e5e5e5"/>
            <stop offset="100%" stop-color="#999999"/>
          </linearGradient>
          <radialGradient id="faceGrad" cx="48%" cy="42%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="60%" stop-color="#cccccc"/>
            <stop offset="90%" stop-color="#666666"/>
            <stop offset="100%" stop-color="#111111"/>
          </radialGradient>
          <linearGradient id="hairGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#050505"/>
            <stop offset="70%" stop-color="#1a1a1a"/>
            <stop offset="100%" stop-color="#333333"/>
          </linearGradient>
        </defs>
        <!-- Background -->
        <rect width="400" height="400" fill="url(#bgGrad)"/>
        
        <!-- Shoulders / Suit Coat -->
        <path d="M 40 400 L 70 310 Q 130 270 200 275 Q 270 270 330 310 L 360 400 Z" fill="#111111"/>
        <path d="M 120 400 L 150 310 Q 200 325 250 310 L 280 400 Z" fill="#ffffff"/>
        <!-- Tie -->
        <polygon points="190,320 210,320 218,390 200,400 182,390" fill="#000000"/>
        <!-- Collar -->
        <polygon points="150,305 185,325 170,290" fill="#f0f0f0"/>
        <polygon points="250,305 215,325 230,290" fill="#f0f0f0"/>
        
        <!-- Neck -->
        <rect x="175" y="230" width="50" height="70" rx="6" fill="#cccccc"/>
        <path d="M 175 250 Q 200 270 225 250 L 225 290 L 175 290 Z" fill="#888888" opacity="0.4"/>
        
        <!-- Head / Jaw Shape -->
        <path d="M 130 150 C 130 80 270 80 270 150 C 270 225 245 260 200 262 C 155 260 130 225 130 150 Z" fill="url(#faceGrad)"/>
        
        <!-- Ears -->
        <ellipse cx="128" cy="165" rx="10" ry="22" fill="#aaaaaa"/>
        <ellipse cx="272" cy="165" rx="10" ry="22" fill="#999999"/>
        
        <!-- Hair -->
        <path d="M 120 145 C 120 70 160 30 200 30 C 250 30 280 70 280 145 C 270 110 250 95 200 95 C 150 95 130 110 120 145 Z" fill="url(#hairGrad)"/>
        <path d="M 125 130 Q 150 85 210 80 Q 260 85 275 130 C 265 100 240 85 200 88 C 160 85 135 100 125 130 Z" fill="#444444"/>
        
        <!-- Eyebrows -->
        <path d="M 150 135 Q 170 130 185 136" stroke="#111111" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M 250 135 Q 230 130 215 136" stroke="#111111" stroke-width="4" stroke-linecap="round" fill="none"/>
        
        <!-- Eyes -->
        <ellipse cx="168" cy="150" rx="9" ry="5.5" fill="#ffffff" stroke="#222" stroke-width="1.5"/>
        <circle cx="168" cy="150" r="3.8" fill="#111111"/>
        <circle cx="166.5" cy="148.5" r="1.2" fill="#ffffff"/>
        
        <ellipse cx="232" cy="150" rx="9" ry="5.5" fill="#ffffff" stroke="#222" stroke-width="1.5"/>
        <circle cx="232" cy="150" r="3.8" fill="#111111"/>
        <circle cx="230.5" cy="148.5" r="1.2" fill="#ffffff"/>
        
        <!-- Nose -->
        <path d="M 200 140 L 196 185 L 204 185" stroke="#555555" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M 192 188 Q 200 193 208 188" stroke="#333333" stroke-width="2" fill="none"/>
        
        <!-- Lips / Mouth -->
        <path d="M 182 215 Q 200 212 218 215" stroke="#333333" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M 186 218 Q 200 226 214 218" stroke="#666666" stroke-width="2" fill="none"/>
        
        <!-- High-Contrast Monochrome Halftone Accent Lines -->
        <line x1="30" y1="50" x2="90" y2="50" stroke="#000000" stroke-width="1" stroke-dasharray="2 4"/>
        <line x1="310" y1="50" x2="370" y2="50" stroke="#000000" stroke-width="1" stroke-dasharray="2 4"/>
      </svg>`
    )}`,
  },
  {
    id: 'bw-cyber-avatar',
    name: 'Cyberpunk Dev Avatar',
    subtitle: 'High-Tech Humanoid Interface',
    category: 'Tech',
    description: 'Stylized futuristic technologist with tactical optics and neural interface accents.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#000000"/>
        <!-- Grid Matrix Accent -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#222222" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#grid)"/>
        
        <!-- Holographic Head Outline -->
        <polygon points="120,130 150,70 250,70 280,130 260,250 200,290 140,250" fill="#111111" stroke="#ffffff" stroke-width="3"/>
        
        <!-- Visor / Optic Shield -->
        <polygon points="135,140 265,140 255,185 145,185" fill="#ffffff"/>
        <line x1="145" y1="162" x2="255" y2="162" stroke="#000000" stroke-width="3"/>
        <rect x="185" y="152" width="30" height="20" fill="#000000"/>
        <circle cx="200" cy="162" r="4" fill="#ffffff"/>
        
        <!-- Jaw & Respirator -->
        <polygon points="170,220 230,220 220,265 180,265" fill="#333333" stroke="#ffffff" stroke-width="2"/>
        <line x1="175" y1="235" x2="225" y2="235" stroke="#ffffff" stroke-width="2"/>
        <line x1="175" y1="245" x2="225" y2="245" stroke="#ffffff" stroke-width="2"/>
        
        <!-- Neck & Torso -->
        <polygon points="140,290 260,290 310,400 90,400" fill="#0a0a0a" stroke="#ffffff" stroke-width="2"/>
        <line x1="200" y1="290" x2="200" y2="400" stroke="#ffffff" stroke-width="3"/>
        <line x1="130" y1="350" x2="270" y2="350" stroke="#ffffff" stroke-width="2"/>
        
        <!-- Neural Nodes -->
        <circle cx="100" cy="130" r="10" fill="#ffffff"/>
        <circle cx="300" cy="130" r="10" fill="#ffffff"/>
        <line x1="100" y1="130" x2="135" y2="150" stroke="#ffffff" stroke-width="2"/>
        <line x1="300" y1="130" x2="265" y2="150" stroke="#ffffff" stroke-width="2"/>
      </svg>`
    )}`,
  },
  {
    id: 'bw-urban-architecture',
    name: 'Architectural Monolith',
    subtitle: 'Brutalist Geometry & Facade',
    category: 'Architecture',
    description: 'High-contrast architectural perspectives with angular lighting and structural grid lines.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        <!-- Central Tower -->
        <polygon points="200,20 290,100 290,380 200,400 110,380 110,100" fill="#000000"/>
        <!-- Light Face -->
        <polygon points="200,20 200,400 110,380 110,100" fill="#444444"/>
        <!-- Shadow Face -->
        <polygon points="200,20 290,100 290,380 200,400" fill="#111111"/>
        
        <!-- Architectural Windows Grid -->
        <g stroke="#ffffff" stroke-width="2">
          <line x1="130" y1="120" x2="180" y2="140"/>
          <line x1="130" y1="160" x2="180" y2="180"/>
          <line x1="130" y1="200" x2="180" y2="220"/>
          <line x1="130" y1="240" x2="180" y2="260"/>
          <line x1="130" y1="280" x2="180" y2="300"/>
          <line x1="130" y1="320" x2="180" y2="340"/>
        </g>
        
        <g stroke="#666666" stroke-width="2">
          <line x1="220" y1="140" x2="270" y2="120"/>
          <line x1="220" y1="180" x2="270" y2="160"/>
          <line x1="220" y1="220" x2="270" y2="200"/>
          <line x1="220" y1="260" x2="270" y2="240"/>
          <line x1="220" y1="300" x2="270" y2="280"/>
          <line x1="220" y1="340" x2="270" y2="320"/>
        </g>
        
        <!-- Sky Horizon Halftone Beams -->
        <line x1="20" y1="360" x2="380" y2="360" stroke="#000000" stroke-width="4"/>
        <line x1="20" y1="375" x2="380" y2="375" stroke="#000000" stroke-width="2"/>
        <line x1="20" y1="385" x2="380" y2="385" stroke="#000000" stroke-width="1"/>
      </svg>`
    )}`,
  },
  {
    id: 'bw-vintage-camera',
    name: 'Precision Optical Camera',
    subtitle: 'Classic 35mm Rangefinder',
    category: 'Tech',
    description: 'Iconic mechanical optics and aperture blades rendered with high-contrast precision.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#ffffff"/>
        <!-- Camera Body -->
        <rect x="50" y="110" width="300" height="200" rx="16" fill="#111111" stroke="#000000" stroke-width="6"/>
        <rect x="50" y="110" width="300" height="60" fill="#e5e5e5" stroke="#000000" stroke-width="4"/>
        
        <!-- Rangefinder Windows -->
        <rect x="80" y="125" width="36" height="24" rx="4" fill="#000000"/>
        <circle cx="150" cy="137" r="10" fill="#000000"/>
        <rect x="290" y="125" width="40" height="26" rx="4" fill="#ffffff" stroke="#000000" stroke-width="3"/>
        
        <!-- Shutter Button & Dial -->
        <rect x="80" y="90" width="28" height="20" rx="3" fill="#666666" stroke="#000000" stroke-width="3"/>
        <rect x="270" y="96" width="36" height="14" rx="3" fill="#999999" stroke="#000000" stroke-width="3"/>
        
        <!-- Big Lens Aperture -->
        <circle cx="200" cy="225" r="75" fill="#222222" stroke="#ffffff" stroke-width="6"/>
        <circle cx="200" cy="225" r="55" fill="#000000" stroke="#888888" stroke-width="4"/>
        <circle cx="200" cy="225" r="35" fill="#111111" stroke="#ffffff" stroke-width="2"/>
        
        <!-- Lens Glint Reflex -->
        <path d="M 180 185 Q 200 175 220 185" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="178" cy="210" r="7" fill="#ffffff"/>
      </svg>`
    )}`,
  },
  {
    id: 'bw-nr-monogram',
    name: 'NR Architectural Monogram',
    subtitle: 'Brutalist Typographic Mark',
    category: 'Art',
    description: 'Monolithic typographic seal combining ultra-bold geometry and high-contrast space.',
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="400" height="400" fill="#000000"/>
        <rect x="20" y="20" width="360" height="360" fill="none" stroke="#ffffff" stroke-width="12"/>
        <rect x="40" y="40" width="320" height="320" fill="none" stroke="#ffffff" stroke-width="3"/>
        <text x="200" y="260" font-family="system-ui, -apple-system, monospace, sans-serif" font-weight="900" font-size="180" fill="#ffffff" text-anchor="middle" letter-spacing="-8">NR</text>
        <line x1="60" y1="290" x2="340" y2="290" stroke="#ffffff" stroke-width="8"/>
        <text x="200" y="325" font-family="monospace, sans-serif" font-weight="700" font-size="20" fill="#ffffff" text-anchor="middle" letter-spacing="8">STUDIO • 300 DPI</text>
      </svg>`
    )}`,
  },
];
