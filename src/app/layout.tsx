import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from "@/components/ClientAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Trading Journal",
  description: "Track your trading performance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          <ClientAuthProvider>
            {children}
          </ClientAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
