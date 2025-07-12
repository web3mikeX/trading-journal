import type { Metadata } from "next";
import "./globals.css";
import ClientAuthProvider from "@/components/ClientAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";

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
          <ToastProvider>
            <ClientAuthProvider>
              {children}
            </ClientAuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
