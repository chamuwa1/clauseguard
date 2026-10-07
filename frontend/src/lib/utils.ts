import { RiskLevel } from "@/types";

export function getRiskColor(risk: RiskLevel): string {
  return {
    low: "risk-low",
    medium: "risk-medium",
    high: "risk-high",
  }[risk];
}

export function getRiskBadgeStyle(risk: RiskLevel): string {
  return {
    low: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    high: "bg-red-500/20 text-red-400 border border-red-500/30",
  }[risk];
}

export function getRiskGlow(risk: RiskLevel): string {
  return {
    low: "shadow-emerald-500/10",
    medium: "shadow-amber-500/10",
    high: "shadow-red-500/20",
  }[risk];
}

export function getRiskGradient(score: number): string {
  if (score >= 7) return "from-red-500 to-red-700";
  if (score >= 4) return "from-amber-500 to-orange-600";
  return "from-emerald-500 to-teal-600";
}

export function formatClauseType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
