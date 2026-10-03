// Type declarations for the supplied (unmodified) sahaay_classifier.js.
export interface SahaayModel {
  name: string;
  version: string;
  labels: string[];
  vocab: string[];
  weights: number[][];
  bias: number[];
  thresholds: Record<string, number>;
  uncertain_margin: number;
  [key: string]: unknown;
}
export interface PreparedModel extends SahaayModel {
  index: Map<string, number>;
}
export type ClassifierStatus = "detected" | "possible" | "not_detected";
export interface LabelResult {
  label: string;
  probability: number;
  threshold: number;
  status: ClassifierStatus;
}
export interface ClassifyResult {
  results: LabelResult[];
  detected: string[];
  possible: string[];
  needs_human_review: true;
  recognised_features: number;
  message: string;
}
export function normalise(text: string): string;
export function features(text: string): Set<string>;
export function prepare(model: SahaayModel): PreparedModel;
export function classify(prepared: PreparedModel, note: string): ClassifyResult;
