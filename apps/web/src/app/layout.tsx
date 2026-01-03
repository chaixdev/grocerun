import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Grocerun",
  description: "A modern shopping list app",
};

import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/sonner"
import { ResponsiveShell } from "@/components/layout/responsive-shell"
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
          <Header user={session?.user} />
          <ResponsiveShell user={session?.user}>
            {children}
          </ResponsiveShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
