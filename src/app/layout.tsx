import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { GlobalNavbar } from "@/components/auth/GlobalNavbar";
import { GA_TRACKING_ID } from "@/lib/gtag";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nedject — genQRstudio 300 DPI Photo QR Code Generator",
  description: "genQRstudio — Industrial 300 DPI Photo QR Code Generator with B/W print calibration, multi-format export, and event pass matrix engineering.",
  openGraph: {
    title: "Nedject — genQRstudio 300 DPI Photo QR Code Generator",
    description: "genQRstudio — Industrial 300 DPI Photo QR Code Generator with B/W print calibration, multi-format export, and event pass matrix engineering.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f5f5f0] text-black">
        {/* Google Analytics 4 (gtag.js) */}
        {GA_TRACKING_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_TRACKING_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
        <AuthProvider>
          <GlobalNavbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}

