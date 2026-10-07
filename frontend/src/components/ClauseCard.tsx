"use client";

import { useState } from "react";
import { ClauseAnalysis } from "@/types";
import { formatClauseType } from "@/lib/utils";

interface ClauseCardProps {
  clause: ClauseAnalysis;
  index: number;
}

export function ClauseCard({ clause, index }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreBarColor = {
    low: "bg-emerald-600",
    medium: "bg-amber-500",
    high: "bg-red-600",
  }[clause.risk_level];

  return (
    <div
      className={`
        warm-card
        transition-all duration-300 hover:scale-[1.002]
        animate-fade-in overflow-hidden
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <button
        className="w-full text-left p-6 flex items-start gap-4 hover:bg-stone-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        id={`clause-card-${index}`}
        aria-expanded={expanded}
      >
        {/* Risk score ring */}
        <div className="relative flex-shrink-0">
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center text-base font-black shadow-sm
            ${clause.risk_level === "high" ? "bg-red-100 text-red-700 border border-red-200" :
              clause.risk_level === "medium" ? "bg-amber-100 text-amber-700 border border-amber-200" :
              "bg-emerald-100 text-emerald-700 border border-emerald-200"}
          `}>
            {clause.risk_score}
          </div>
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-stone-900 text-lg">
              {formatClauseType(clause.clause_type)}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-md font-bold uppercase tracking-wide ${
              clause.risk_level === "high" ? "bg-red-600 text-white" :
              clause.risk_level === "medium" ? "bg-amber-500 text-white" :
              "bg-emerald-600 text-white"
            }`}>
              {clause.risk_level} RISK
            </span>
          </div>
          {/* Score bar */}
          <div className="mt-3 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/50">
            <div
              className={`h-full ${scoreBarColor} rounded-full transition-all duration-700`}
              style={{ width: `${(clause.risk_score / 10) * 100}%` }}
            />
          </div>
          {!expanded && (
            <p className="text-sm text-stone-500 mt-3 line-clamp-1 font-medium">
              {clause.plain_english}
            </p>
          )}
        </div>

        {/* Expand icon */}
        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-1">
          <svg
            className={`w-5 h-5 text-stone-600 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-stone-200 bg-stone-50 pt-6">
          {/* Plain English */}
          <div>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-2">Plain English Meaning</p>
            <p className="text-base text-stone-800 font-medium leading-relaxed">{clause.plain_english}</p>
          </div>

          {/* Why risky */}
          {clause.risk_level !== "low" && (
            <div className="rounded-xl p-5 bg-white border border-red-200 shadow-sm">
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Why This Is Risky
              </p>
              <p className="text-sm text-stone-700 font-medium leading-relaxed">{clause.why_risky}</p>
            </div>
          )}

          {/* Negotiation suggestion */}
          {clause.negotiation_suggestion && clause.negotiation_suggestion !== "No changes needed." && (
            <div className="rounded-xl p-5 bg-white border border-indigo-200 shadow-sm">
              <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Suggested Redline
              </p>
              <p className="text-sm text-stone-700 font-medium leading-relaxed">{clause.negotiation_suggestion}</p>
            </div>
          )}

          {/* Original text */}
          <div className="pt-2">
            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-2">Original Clause Text</p>
            <blockquote className="text-sm text-stone-500 font-mono italic bg-stone-100 p-4 rounded-xl border border-stone-200 leading-relaxed">
              "{clause.original_text}"
            </blockquote>
          </div>
        </div>
      )}
    </div>
  );
}
