import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata = {
  title: "BrightListed — Listings in a Snap",
  description:
    "AI-powered listing assistance. Upload photos, get professional listings, accurate pricing, and sales-ready images in seconds.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} h-full min-h-dvh antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-[#F4F9F7] font-sans text-[#1A3A32]">
        {children}
      </body>
    </html>
  );
}
