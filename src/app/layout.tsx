import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { LocaleProvider } from "@/components/layout/locale-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "DaamKoto — Compare Hardware Prices in Bangladesh",
    template: "%s | DaamKoto",
  },
  description:
    "Compare computer and electronics hardware prices, stock, and specs across Bangladesh's leading computer retailers.",
  openGraph: {
    type: "website",
    siteName: "DaamKoto",
    locale: "en_BD",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
