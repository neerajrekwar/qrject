import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { GlobalNavbar } from "@/components/auth/GlobalNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRject — genQRstudio 300 DPI Photo QR Code Generator",
  description: "genQRstudio — Industrial 300 DPI Photo QR Code Generator with B/W print calibration, multi-format export, and event pass matrix engineering.",
  openGraph: {
    title: "QRject — genQRstudio 300 DPI Photo QR Code Generator",
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
        <AuthProvider>
          <GlobalNavbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}

