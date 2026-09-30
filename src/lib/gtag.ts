/**
 * Google Analytics 4 (GA4) Tag & Helper Functions
 * Measurement ID: G-NRYX5TFZWY
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-NRYX5TFZWY';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = (action: string, params: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', action, params);
  }
};
