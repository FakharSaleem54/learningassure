import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { GamificationProvider } from "@/context/GamificationContext";

export const metadata: Metadata = {
  title: "Learning Assure — Home",
  description: "Learn by doing with practical courses and verified certificates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <GamificationProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
        </GamificationProvider>
      </body>
    </html>
  );
}
