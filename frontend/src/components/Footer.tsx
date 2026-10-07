"use client";
import { useState } from 'react';

export function Footer() {
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | 'disclaimer' | null>(null);

  const contentMap = {
    privacy: {
      title: "Privacy Policy",
      body: "We process your contract documents purely in-memory. They are never used to train AI models. Extracted clauses are stored securely via Supabase solely to generate a shareable report link. No raw documents are retained."
    },
    terms: {
      title: "Terms of Service",
      body: "By using ClauseGuard, you agree that this tool is for educational and informational purposes only. You must not rely on it for binding legal decisions."
    },
    disclaimer: {
      title: "Disclaimer",
      body: "ClauseGuard is NOT a law firm and does NOT provide legal advice. The AI analysis is intended to flag potential risks but may miss critical nuances. Always consult a qualified attorney."
    }
  };

  const content = modalContent ? contentMap[modalContent] : null;

  return (
    <footer className="border-t border-stone-200 bg-[#FDFBF7] py-12 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-black text-xl tracking-tight text-stone-900">ClauseGuard</span>
            <span className="text-sm font-bold text-stone-500">© 2026 ClauseGuard. All rights reserved.</span>
          </div>

          {/* Legal Links triggering Modal */}
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => setModalContent('privacy')} className="text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors">Privacy Policy</button>
            <button onClick={() => setModalContent('terms')} className="text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors">Terms of Service</button>
            <button onClick={() => setModalContent('disclaimer')} className="text-sm font-bold text-stone-500 hover:text-stone-900 transition-colors">Disclaimer</button>
          </div>
        </div>
      </div>

      {/* Solid non-transparent Modal Popup */}
      {modalContent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 backdrop-blur-sm p-4">
          <div className="warm-card w-full max-w-lg p-8 relative animate-fade-in shadow-2xl">
            
            {/* Close Button */}
            <button
              onClick={() => setModalContent(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-stone-100 text-stone-400 hover:text-stone-900 hover:bg-stone-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-2xl font-black text-stone-900 mb-6">{content?.title}</h3>
            <div className="text-stone-600 text-sm font-medium leading-relaxed space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <p>{content?.body}</p>
            </div>
            
            <button 
              onClick={() => setModalContent(null)}
              className="mt-8 w-full py-3 btn-primary uppercase tracking-wide text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
