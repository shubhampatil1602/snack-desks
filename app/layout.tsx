import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Nunito_Sans,
  Instrument_Serif,
} from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeColorProvider } from "@/components/theme/theme-color-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const instrumentSerifHeading = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-heading",
});

const nunitoSans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SnackDesk",
  description: "Snack ordering platform for modern teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        nunitoSans.variable,
        instrumentSerifHeading.variable,
      )}
    >
      <body className='min-h-full flex flex-col'>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme-color');
                if (theme === null) theme = 'claude';
                
                if (theme && theme !== 'default') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch (e) {}
            `,
          }}
        />
        <ThemeProvider
          attribute='class'
          defaultTheme='dark'
          enableSystem
          disableTransitionOnChange
        >
          <ThemeColorProvider>
          {children}
          <Toaster position='bottom-right' />
          </ThemeColorProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
