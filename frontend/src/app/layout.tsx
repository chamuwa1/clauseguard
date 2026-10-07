import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ClauseGuard — AI Contract Risk Analyzer for Freelancers",
  description:
    "Upload your freelance contract or NDA and get instant clause-by-clause risk analysis. ClauseGuard flags risky clauses, explains them in plain English, and suggests negotiation points.",
  keywords: ["contract analyzer", "NDA risk", "freelancer contracts", "legal AI", "clause risk"],
  openGraph: {
    title: "ClauseGuard — Know What You're Signing",
    description: "AI-powered contract risk analyzer. Free, instant, plain English.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col bg-[#FDFBF7] text-[#2C2A29]`}>
        {/* Professional Navbar */}
        <nav className="sticky top-0 z-50 w-full mb-8 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="font-bold text-xl tracking-tight text-stone-900">
                  ClauseGuard
                </span>
              </div>
              
              {/* Simple disclaimer */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-stone-900 hidden sm:block">
                  Not legal advice · Educational use only
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area (grows to push footer down) */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <ScrollToTop />

        {/* Professional Footer */}
        <Footer />
      </body>
    </html>
  );
}
