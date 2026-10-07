"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import { AnalysisResult } from "@/types";
import { ResultsView } from "@/components/ResultsView";
import { getAnalysis } from "@/lib/api";

function ReportContent() {
  const params = useParams();
  const id = params.id as string;
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      if (!id) return;
      try {
        const response = await getAnalysis(id);

        if (!response.ok) {
          throw new Error("Report not found or expired.");
        }
        
        const data = await response.json();
        setResult(data as AnalysisResult);
      } catch (err: any) {
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  return (
    <div className="container-main py-12">
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-stone-900 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-stone-500 font-bold text-sm uppercase tracking-wider animate-pulse">Loading Risk Report...</p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="warm-card p-8 rounded-2xl max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">Report Unavailable</h2>
            <p className="text-stone-500 font-medium text-sm leading-relaxed mb-8">{error}</p>
            <a 
              href="/"
              className="inline-block px-6 py-3 rounded-xl btn-primary transition-all"
            >
              Analyze a new contract
            </a>
          </div>
        </div>
      )}

      {result && (
        <div className="mb-8">
          <a href="/" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-bold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </a>
        </div>
      )}

      {result && <ResultsView result={result} />}
    </div>
  );
}

export default function ReportPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C2A29]">
      <Suspense fallback={
        <div className="container-main py-12 flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-12 h-12 rounded-xl bg-white border border-stone-200 shadow-sm flex items-center justify-center mb-6">
            <svg className="w-6 h-6 text-stone-900 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-stone-500 font-bold text-sm uppercase tracking-wider animate-pulse">Loading Risk Report...</p>
        </div>
      }>
        <ReportContent />
      </Suspense>
    </main>
  );
}
