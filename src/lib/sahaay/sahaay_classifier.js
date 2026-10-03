// Sahaay barrier classifier - offline inference (no network, no dependencies).
// Load sahaay_model_v0.1.json (bundle it with the app) and call classify(model, note).
// The model identifies possible NON-CLINICAL barriers to referral completion only.
// It never diagnoses, triages, or estimates medical risk. A health worker confirms every result.

export function normalise(text) {
  let t = text.normalize("NFC").toLowerCase();
  t = t.replace(/\u093c/g, "").replace(/\u0901/g, "\u0902"); // drop nukta; chandrabindu -> anusvara
  return t.replace(/[^a-z0-9\u0900-\u097f]+/g, " ").trim();
}

export function features(text) {
  const f = new Set();
  const words = normalise(text).split(" ").filter(Boolean);
  for (const w of words) {
    f.add("w:" + w);
    const p = "<" + w + ">";
    const chars = Array.from(p);           // code points, matching Python string indexing
    for (const n of [2, 3, 4]) {
      for (let i = 0; i + n <= chars.length; i++) f.add("c:" + chars.slice(i, i + n).join(""));
    }
  }
  return f;
}

export function prepare(model) {
  const index = new Map(model.vocab.map((v, i) => [v, i]));
  return { ...model, index };
}

export function classify(prepared, note) {
  const m = prepared;
  const hits = [];
  for (const f of features(note)) { const i = m.index.get(f); if (i !== undefined) hits.push(i); }
  const value = hits.length ? 1 / Math.sqrt(hits.length) : 0;
  const results = m.labels.map((label, j) => {
    let z = m.bias[j];
    for (const i of hits) z += m.weights[j][i] * value;
    const p = 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, z))));
    const t = m.thresholds[label];
    const status = p >= t ? "detected" : p >= t - m.uncertain_margin ? "possible" : "not_detected";
    return { label, probability: Math.round(p * 100) / 100, threshold: t, status };
  });
  const detected = results.filter(r => r.status === "detected");
  const possible = results.filter(r => r.status === "possible");
  let message;
  if (hits.length === 0) message = "Not sure — the note has no words the model recognises. Ask the patient for more information.";
  else if (detected.length === 0) message = "Not sure — ask the patient for more information.";
  else message = "Possible barriers found. Please confirm or correct before saving.";
  return { results, detected: detected.map(r => r.label), possible: possible.map(r => r.label),
           needs_human_review: true, recognised_features: hits.length, message };
}
