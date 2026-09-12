import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Ain Ul Quran — E-Learning & QA Platform",
  description: "Modern E-Learning platform for Quran Academies with live video classes, attendance tracking, and human review system.",
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('theme-preference');
      var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (saved === 'dark' || (!saved && supportDarkMode) || (saved === 'system' && supportDarkMode)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

const devToolsFixScript = `
  (function() {
    if (typeof window === 'undefined') return;
    var isSuppressed = function(msg) {
      return typeof msg === 'string' && (
        msg.indexOf("Cannot read properties of undefined (reading 'startTime')") !== -1 ||
        msg.indexOf("reportAllChanges") !== -1
      );
    };

    var prevOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (isSuppressed(message) || (error && error.message && isSuppressed(error.message))) {
        return true;
      }
      if (typeof prevOnError === 'function') {
        return prevOnError.apply(this, arguments);
      }
      return false;
    };

    window.addEventListener('error', function(event) {
      if (event && (isSuppressed(event.message) || (event.error && isSuppressed(event.error.message)))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);

    window.addEventListener('unhandledrejection', function(event) {
      var reason = event && event.reason;
      var msg = reason && (reason.message || String(reason));
      if (isSuppressed(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: devToolsFixScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          <Footer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
