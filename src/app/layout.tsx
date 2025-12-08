import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nama Water Services",
  description: "Nama Water Services Portal - Branch Operations and Customer Service",
  icons: {
    icon: [
      { url: "/Assets/Images/global/nama_logo.png" },
      { url: "/Assets/Images/global/nama_logo.png", sizes: "32x32", type: "image/png" },
      { url: "/Assets/Images/global/nama_logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/Assets/Images/global/nama_logo.png",
  },
  openGraph: {
    title: "Nama Water Services",
    description: "Nama Water Services Portal - Branch Operations and Customer Service",
    images: ["/Assets/Images/global/nama_logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
