import type { PreparedModel, ClassifyResult } from "./sahaay_classifier.js";

export interface LabelExplanation {
  evidence: { word: string; contribution: number }[];
  weak: boolean;
  mostly_grammar_words: boolean;
}
export function explain(prepared: PreparedModel, note: string, maxWords?: number): Record<string, LabelExplanation>;
export function askNext(classification: ClassifyResult): string | null;
