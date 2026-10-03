// Thin wrapper around the supplied Small AI. The model JSON is bundled (imported),
// prepared once at app start, and the supplied classify() does all inference.
import modelJson from "./sahaay_model_v0.1.json";
import { prepare, classify, type PreparedModel, type ClassifyResult, type SahaayModel } from "./sahaay_classifier.js";

let prepared: PreparedModel | null = null;
let loadError: string | null = null;

try {
  prepared = prepare(modelJson as unknown as SahaayModel);
} catch (e) {
  loadError = e instanceof Error ? e.message : String(e);
  console.error("Sahaay model failed to load", e);
}

export const MODEL_INFO = {
  name: (modelJson as { name: string }).name,
  version: (modelJson as { version: string }).version,
};

export function modelReady(): boolean {
  return prepared !== null;
}
export function modelLoadError(): string | null {
  return loadError;
}

export class ModelNotLoadedError extends Error {}

export function analyseNote(note: string): ClassifyResult {
  if (!prepared) throw new ModelNotLoadedError("Offline AI model could not be loaded.");
  return classify(prepared, note);
}

export type { ClassifyResult };
