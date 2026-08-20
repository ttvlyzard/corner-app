import type { Metadata, Viewport } from "next";
import { Fraunces, Work_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import PageTransition from "@/components/PageTransition";
import ThemeInit from "@/components/ThemeInit";
import DarkModeToggle from "@/components/DarkModeToggle";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["500", "600", "700", "900"],
});
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "700", "800"],
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Corner — Chores, brewed daily",
  description: "Assign, complete, and verify chores together.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Corner",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#3F5A2C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable} ${jetbrains.variable}`}>
      <body suppressHydrationWarning className="font-sans">
        <ThemeInit />
        <PageTransition>{children}</PageTransition>
        <DarkModeToggle />
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: "var(--font-work-sans)",
              borderRadius: "1rem",
            },
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
