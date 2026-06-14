import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Grocerun",
  description: "A modern shopping list app for households",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", type: "image/png" },
    ],
  },
};

import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "@/components/providers"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"
import { ResponsiveShell } from "@/components/layout/responsive-shell"
import { DiagnosticsGate } from "@/components/diagnostics-gate"
import { auth } from "@/core/auth"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <Header user={session?.user} />
            <ResponsiveShell user={session?.user}>
              {children}
            </ResponsiveShell>
            <Toaster />
            <DiagnosticsGate />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
