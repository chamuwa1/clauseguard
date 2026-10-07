// Types shared across the ClauseGuard frontend

export type RiskLevel = "low" | "medium" | "high";

export type ClauseType =
  | "indemnity"
  | "ip_assignment"
  | "non_compete"
  | "termination"
  | "payment_terms"
  | "liability_cap"
  | "governing_law"
  | "dispute_resolution"
  | "confidentiality"
  | "other";

export type Jurisdiction = "generic" | "us" | "uk" | "ca" | "au" | "eu" | "in" | "sri_lanka";

export interface ClauseAnalysis {
  clause_type: ClauseType;
  original_text: string;
  risk_level: RiskLevel;
  risk_score: number;
  plain_english: string;
  why_risky: string;
  negotiation_suggestion: string;
}

export interface OverallSummary {
  risk_score: number;
  risk_label: RiskLevel;
  top_concerns: string[];
  one_liner: string;
}

export interface AnalysisResult {
  analysis_id: string;
  document_name: string;
  jurisdiction: Jurisdiction;
  total_clauses_found: number;
  flagged_clauses: number;
  clauses: ClauseAnalysis[];
  summary: OverallSummary;
  share_url: string | null;
}

export const CLAUSE_TYPE_LABELS: Record<ClauseType, string> = {
  indemnity: "Indemnity",
  ip_assignment: "IP Assignment",
  non_compete: "Non-Compete",
  termination: "Termination",
  payment_terms: "Payment Terms",
  liability_cap: "Liability Cap",
  governing_law: "Governing Law",
  dispute_resolution: "Dispute Resolution",
  confidentiality: "Confidentiality",
  other: "Other",
};

export const JURISDICTION_LABELS: Record<Jurisdiction, string> = {
  generic: "Generic",
  us: "United States",
  uk: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  eu: "European Union",
  in: "India",
  sri_lanka: "Sri Lanka",
};
