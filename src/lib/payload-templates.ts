export interface PayloadTemplate {
  id: string;
  category: 'Text' | 'Web & Links' | 'Contact & Social' | 'Connectivity' | 'Commerce & Crypto' | 'Events & Notes';
  title: string;
  iconName: string;
  description: string;
  templateValue: string;
}

export const RAPID_PAYLOAD_TEMPLATES: PayloadTemplate[] = [
  // 1. TEXT TEMPLATES
  {
    id: 'text-plain',
    category: 'Text',
    title: 'Plain Text Message',
    iconName: 'FileText',
    description: 'Direct alphanumeric text message or unformatted note',
    templateValue: 'Nedject High-Resolution Studio · Deterministic 300 DPI Canvas Engine',
  },
  {
    id: 'text-secret',
    category: 'Text',
    title: 'Encrypted Token / Secret',
    iconName: 'Key',
    description: 'Alphanumeric hash token or secret key identifier',
    templateValue: 'SEC-KEY-9840-XF92-BC44-ALPHA-STAGE',
  },
  {
    id: 'text-ascii-banner',
    category: 'Text',
    title: 'Terminal ASCII Banner',
    iconName: 'Terminal',
    description: 'Formatted multi-line terminal system readout',
    templateValue: '[SYSTEM: ONLINE]\nSTATUS: 300_DPI_CALIBRATED\nHOST: Nedject_PRO_MATRIX\nCHECKSUM: 0x88AF2C9',
  },
  {
    id: 'text-quote',
    category: 'Text',
    title: 'Developer Manifesto / Bio',
    iconName: 'Quote',
    description: 'Multi-line personal or company mission statement',
    templateValue: 'NEERAJ REKWAR // SENIOR FULLSTACK & SYSTEMS ARCHITECT\nBuilding high-throughput, deterministic web platforms with zero radius discipline.',
  },

  // 2. WEB & LINKS
  {
    id: 'url-portfolio',
    category: 'Web & Links',
    title: 'Portfolio Website',
    iconName: 'Globe',
    description: 'Direct link to developer portfolio or personal website',
    templateValue: 'https://Nedject.dev',
  },
  {
    id: 'url-github',
    category: 'Web & Links',
    title: 'GitHub Repository',
    iconName: 'GitBranch',
    description: 'Direct link to open-source repository or profile',
    templateValue: 'https://github.com/neerajrekwar',
  },
  {
    id: 'url-kofi',
    category: 'Web & Links',
    title: 'Ko-fi Supporter Page',
    iconName: 'Coffee',
    description: 'Direct creator contribution and tipping link',
    templateValue: 'https://ko-fi.com/neerajrekwar2001',
  },
  {
    id: 'url-instagram',
    category: 'Web & Links',
    title: 'Instagram Profile',
    iconName: 'Share2',
    description: 'Deep link to user profile on Instagram',
    templateValue: 'https://instagram.com/neerajrekwar',
  },

  // 3. CONTACT & SOCIAL
  {
    id: 'contact-vcard',
    category: 'Contact & Social',
    title: 'Digital Business Card (vCard 3.0)',
    iconName: 'UserCheck',
    description: 'Scannable digital contact card saved directly to phone contacts',
    templateValue: `BEGIN:VCARD\nVERSION:3.0\nN:Rekwar;Neeraj;;;\nFN:Neeraj Rekwar\nORG:Nedject Engineering\nTITLE:Principal Systems Architect\nTEL;TYPE=CELL:+919876543210\nEMAIL;TYPE=WORK:neerajrekwar817@gmail.com\nURL:https://ko-fi.com/neerajrekwar2001\nNOTE:Fullstack Developer & High-DPI Photo QR Architect\nEND:VCARD`,
  },
  {
    id: 'contact-email',
    category: 'Contact & Social',
    title: 'Pre-filled Mailto Email',
    iconName: 'Mail',
    description: 'Opens default mail app with recipient, subject, and body',
    templateValue: 'mailto:neerajrekwar817@gmail.com?subject=Collaboration%20Inquiry&body=Hi%20Neeraj,%20I%20love%20the%20Nedject%20platform.',
  },
  {
    id: 'contact-whatsapp',
    category: 'Contact & Social',
    title: 'WhatsApp Direct Chat',
    iconName: 'MessageSquare',
    description: 'Direct 1-click WhatsApp chat link with preloaded message',
    templateValue: 'https://wa.me/919876543210?text=Hello%20Neeraj,%20inquiring%20about%20custom%20software%20architecture',
  },
  {
    id: 'contact-sms',
    category: 'Contact & Social',
    title: 'Direct SMS Payload',
    iconName: 'Smartphone',
    description: 'SMS uri with predefined recipient and message',
    templateValue: 'SMSTO:+919876543210:Hello from Nedject 300 DPI Scanner!',
  },

  // 4. CONNECTIVITY
  {
    id: 'wifi-wpa',
    category: 'Connectivity',
    title: 'Secure Wi-Fi (WPA/WPA2)',
    iconName: 'Wifi',
    description: 'Instant zero-tap Wi-Fi network joining format',
    templateValue: 'WIFI:S:Nedject_Studio_5G;T:WPA;P:HighDpiMatrix2026;;',
  },
  {
    id: 'wifi-open',
    category: 'Connectivity',
    title: 'Open Guest Wi-Fi',
    iconName: 'Wifi',
    description: 'Public guest Wi-Fi hotspot with no password',
    templateValue: 'WIFI:S:Nedject_Guest_Hotspot;T:nopass;;',
  },
  {
    id: 'geo-pin',
    category: 'Connectivity',
    title: 'Map Geolocation Coordinates',
    iconName: 'MapPin',
    description: 'Opens Google Maps or Apple Maps to exact GPS latitude/longitude',
    templateValue: 'geo:28.6139,77.2090?q=28.6139,77.2090(Nedject%20Headquarters)',
  },

  // 5. COMMERCE & CRYPTO
  {
    id: 'pay-upi',
    category: 'Commerce & Crypto',
    title: 'UPI Instant Payment QR',
    iconName: 'QrCode',
    description: 'BHIM, GPay, PhonePe, and Paytm compatible payment URI',
    templateValue: 'upi://pay?pa=neerajrekwar817@okaxis&pn=Neeraj%20Rekwar&am=5.00&cu=INR&tn=Coffee%20Contribution',
  },
  {
    id: 'pay-btc',
    category: 'Commerce & Crypto',
    title: 'Bitcoin Wallet Address',
    iconName: 'DollarSign',
    description: 'Standard BIP-21 Bitcoin payment address with optional amount',
    templateValue: 'bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.0005&label=Developer%20Support',
  },
  {
    id: 'pay-eth',
    category: 'Commerce & Crypto',
    title: 'Ethereum / ERC-20 Address',
    iconName: 'Zap',
    description: 'EIP-681 Ethereum address format',
    templateValue: 'ethereum:0x71C...8976F?value=1e16',
  },

  // 6. EVENTS & PASSES
  {
    id: 'event-ical',
    category: 'Events & Notes',
    title: 'Calendar Event (iCalendar)',
    iconName: 'Calendar',
    description: 'One-tap calendar add event (.ics standard format)',
    templateValue: `BEGIN:VEVENT\nSUMMARY:Nedject 300 DPI Studio Launch\nDESCRIPTION:High-resolution print calibrated engine release\nLOCATION:Global Online\nDTSTART:20261001T120000Z\nDTEND:20261001T140000Z\nEND:VEVENT`,
  },
  {
    id: 'event-ticket',
    category: 'Events & Notes',
    title: 'VIP Event Pass Token',
    iconName: 'Tag',
    description: 'Unique cryptographic admission ticket with attendee metadata',
    templateValue: 'PASS-ID: VIP-99201-NR | TICKET: ALL-ACCESS | EXPIRES: 2026-12-31 | GATE: ALPHA-1',
  },
];
