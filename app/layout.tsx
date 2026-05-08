import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { ThemeProvider } from "next-themes";

import { Header } from "@/components/shared/Header";

export const metadata: Metadata = {
  title: "PM Career Copilot",
  description: "Turn any job description into a complete PM application strategy — parsed JD, resume gap analysis, tailored bullets, LinkedIn outreach, 7-day prep plan, and application tracker.",
  keywords: ["product manager", "PM jobs", "resume", "job application", "career"],
  openGraph: {
    title: "PM Career Copilot",
    description: "From job link to full application plan — in one workspace.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PM Career Copilot",
    description: "From job link to full application plan — in one workspace.",
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎯</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${GeistSans.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
