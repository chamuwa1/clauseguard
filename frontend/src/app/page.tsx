"use client";

import { useState } from "react";
import { AnalysisResult, Jurisdiction } from "@/types";
import { analyzeContract } from "@/lib/api";
import { UploadZone } from "@/components/UploadZone";
import { ResultsView } from "@/components/ResultsView";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div 
      className="warm-card p-6 cursor-pointer hover:border-stone-300 transition-colors" 
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex justify-between items-center gap-4">
        <h3 className="font-black text-stone-900">{q}</h3>
        <svg className={`w-5 h-5 text-stone-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-stone-100 animate-fade-in">
          <p className="text-stone-800 text-sm font-medium leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

type AppState = "idle" | "analyzing" | "results" | "error";

export default function HomePage() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const handleUpload = async (file: File, jurisdiction: Jurisdiction) => {
    setState("analyzing");
    setError("");
    setProgress(0);

    // Fake progress animation while API processes
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 88));
    }, 800);

    try {
      const response = await analyzeContract(file, jurisdiction);
      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(err.detail || `Server error ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      setState("results");
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setError("");
    setProgress(0);
  };

  return (
    <main className="min-h-screen">
      <div className="container-main py-16">

        {/* ── Hero (idle state only) ── */}
        {state === "idle" && (
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="text-4xl sm:text-5xl font-black text-stone-900 mb-4 leading-tight">
              Know What You're
              <br />
              <span className="text-emerald-700">
                Actually Signing
              </span>
            </h1>
            <p className="text-stone-500 text-lg max-w-lg mx-auto font-medium leading-relaxed mb-8">
              Upload your freelance contract or NDA. Get clause by clause risk analysis in plain English in under a minute.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-stone-600 font-bold">
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 shadow-sm rounded-xl">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                PDF & DOCX
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 shadow-sm rounded-xl">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Private & Secure
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 shadow-sm rounded-xl">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Free to use
              </span>
            </div>
          </div>
        )}

        {/* ── Progress bar (analyzing state) ── */}
        {state === "analyzing" && (
          <div className="mb-10 text-center animate-fade-in">
            <h2 className="text-xl font-black text-stone-900 mb-2">Analyzing your contract...</h2>
            <p className="text-stone-500 text-sm font-bold mb-6">Extracting clauses · Assessing risk · Building your report</p>
            <div className="max-w-md mx-auto h-2 bg-stone-200 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-stone-900 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-stone-400 font-bold text-xs mt-3">{Math.round(progress)}% complete</p>

            {/* Skeleton preview */}
            <div className="max-w-2xl mx-auto mt-8 space-y-4">
              {[80, 60, 70, 50].map((w, i) => (
                <div key={i} className="warm-card p-5 rounded-2xl flex items-center gap-4" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0 bg-stone-100 border border-stone-200" />
                  <div className="flex-1 space-y-3">
                    <div className="skeleton h-3 rounded-md bg-stone-100" style={{ width: `${w}%` }} />
                    <div className="skeleton h-2 rounded-md w-1/2 bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {state === "error" && (
          <div className="max-w-md mx-auto text-center mb-10 animate-fade-in">
            <div className="warm-card p-8 rounded-2xl">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-100">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-stone-900 mb-2 font-black text-lg">Analysis Failed</p>
              <p className="text-stone-500 font-medium text-sm mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl btn-secondary uppercase tracking-wide text-sm font-bold w-full sm:w-auto"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="animate-fade-in">
          {(state === "idle" || state === "error") && (
            <UploadZone onUpload={handleUpload} isAnalyzing={false} />
          )}
          {state === "analyzing" && null}
          {state === "results" && result && (
            <ResultsView result={result} onReset={handleReset} />
          )}
        </div>

        {/* ── Feature pills (idle only) ── */}
        {state === "idle" && (
          <section id="features" className="mt-24 mb-16 scroll-mt-24">
            <div className="text-center mb-10 animate-fade-in">
              <h2 className="text-2xl font-black text-stone-900 mb-2">Why ClauseGuard?</h2>
              <p className="text-stone-800 text-sm font-bold">Built for freelancers, by a freelancer.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
              {[
                {
                  icon: (
                    <svg className="w-6 h-6 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: "9 Clause Types",
                  desc: "Indemnity, IP assignment, non-compete, payment terms, and more",
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  title: "Jurisdiction Aware",
                  desc: "Context-sensitive analysis for US, UK, Canada, Australia, EU, India, or Sri Lanka",
                },
                {
                  icon: (
                    <svg className="w-6 h-6 text-stone-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                  title: "Negotiation Points",
                  desc: "Specific redline suggestions, not just risk scores",
                },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="warm-card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 bg-stone-50 border border-stone-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    {icon}
                  </div>
                  <p className="font-black text-stone-900 text-base mb-2">{title}</p>
                  <p className="text-stone-800 text-sm font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Security & Reports Sections (idle only) ── */}
        {state === "idle" && (
          <div className="grid md:grid-cols-2 gap-8 animate-fade-in pb-16" style={{ animationDelay: "300ms" }}>
            <section id="security" className="warm-card p-8 scroll-mt-24">
              <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-3">Bank-Grade Security</h3>
              <p className="text-stone-600 font-medium text-sm leading-relaxed mb-4">
                We do not train our AI on your contracts. Your documents are processed entirely in memory and immediately discarded. The extracted clauses are stored securely via Supabase only to generate your report link.
              </p>
            </section>

            <section id="reports" className="warm-card p-8 scroll-mt-24">
              <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-7 h-7 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-stone-900 mb-3">Shareable Reports</h3>
              <p className="text-stone-600 font-medium text-sm leading-relaxed mb-4">
                Need to push back on a bad contract? Generate a clean, professional risk report in one click and share it directly with your client, partner, or legal counsel via email or WhatsApp.
              </p>
            </section>
          </div>
        )}

        {/* ── Additional Homepage Sections (idle only) ── */}
        {state === "idle" && (
          <div className="space-y-8 pb-16">
            {/* ── How it works ── */}
            <section className="py-12 border-t border-stone-200 animate-fade-in" style={{ animationDelay: "400ms" }}>
              <div className="text-center mb-10">
                <h2 className="text-2xl font-black text-stone-900 mb-2">How it works</h2>
                <p className="text-stone-800 text-sm font-bold">Three steps to peace of mind.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="relative">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4 border border-emerald-200 shadow-sm">1</div>
                  <h3 className="font-bold text-stone-900 mb-2">Upload Contract</h3>
                  <p className="text-stone-800 text-sm font-medium px-4">Drop your PDF or DOCX file into our secure vault. It's processed safely.</p>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4 border border-emerald-200 shadow-sm">2</div>
                  <h3 className="font-bold text-stone-900 mb-2">AI Analysis</h3>
                  <p className="text-stone-800 text-sm font-medium px-4">Our legal-trained AI scans every clause against your selected jurisdiction's laws.</p>
                </div>
                <div className="relative">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4 border border-emerald-200 shadow-sm">3</div>
                  <h3 className="font-bold text-stone-900 mb-2">Get Report</h3>
                  <p className="text-stone-800 text-sm font-medium px-4">Receive a plain-English breakdown of risks and exact negotiation points.</p>
                </div>
              </div>
            </section>

            {/* ── Testimonial ── */}
            <section className="py-6 animate-fade-in" style={{ animationDelay: "500ms" }}>
              <div className="warm-card p-10 text-center relative overflow-hidden">
                <p className="text-xl sm:text-2xl font-medium text-stone-800 leading-relaxed max-w-3xl mx-auto relative z-10 italic">
                  "ClauseGuard caught a perpetual IP assignment in a contract I almost signed. It saved me from giving away the rights to my entire portfolio for free. Every freelancer needs this."
                </p>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-500 font-bold">SJ</div>
                  <div className="text-left">
                    <p className="font-black text-stone-900 text-sm">Sarah Jenkins</p>
                    <p className="text-stone-500 text-xs font-bold">Independent Designer</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-12 animate-fade-in" style={{ animationDelay: "600ms" }}>
              <div className="text-center mb-10">
                <h2 className="text-2xl font-black text-stone-900 mb-2">Frequently Asked Questions</h2>
              </div>
              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  { q: "Does this replace a real lawyer?", a: "No. ClauseGuard is an educational tool designed to give you a strong first-pass analysis so you know what questions to ask. Always consult a qualified attorney for formal legal advice." },
                  { q: "Are my documents kept private?", a: "Absolutely. We do not use your contracts to train any AI models. Documents are processed in memory and discarded immediately after the report is generated." },
                  { q: "What jurisdictions do you support?", a: "We currently support specific legal contexts for the US, UK, Canada, Australia, EU, India, and Sri Lanka, plus a 'Generic' global option." },
                  { q: "Is it really free?", a: "Yes. ClauseGuard is completely free to use for individual freelancers." },
                ].map((faq, i) => (
                  <FAQItem key={i} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
