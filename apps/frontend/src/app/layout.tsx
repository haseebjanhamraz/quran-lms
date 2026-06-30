import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

const sansFont = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const displayFont = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quran LMS — E-Learning & QA Platform",
  description: "Modern E-Learning platform for Quran Academies with live video classes, attendance tracking, and human review system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sansFont.variable} ${displayFont.variable} font-sans antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
