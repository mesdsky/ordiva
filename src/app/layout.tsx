import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { UnsavedChangesProvider } from "@/components/UnsavedChangesProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Ordiva | Plan Smarter. Live Brighter.",
    template: "%s | Ordiva",
  },
  description:
    "Ordiva helps you track transactions, plan budgets, keep an eye on subscriptions and debts, and reach your financial goals in one place.",
  openGraph: {
    title: "Ordiva | Plan Smarter. Live Brighter.",
    description:
      "Manage your money in a simpler, more intentional way.",
    siteName: "Ordiva",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#173C34",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <UnsavedChangesProvider>
          {children}
        </UnsavedChangesProvider>
      </body>
    </html>
  );
}
