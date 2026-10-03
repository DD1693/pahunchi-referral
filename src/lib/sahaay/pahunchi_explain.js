// Pahunchi explainability + "ask next" helpers.
// Works with the existing model JSON (prepare() output from sahaay_classifier.js).
// Does NOT change the classifier or its predictions. It only explains them.
//
// explain(): which words in the note pushed each label up, computed from the
// model's real logistic-regression weights (word + character n-gram features).
// askNext(): which barrier to clarify next, based on the classifier's "possible" band.

import { normalise } from "./sahaay_classifier.js";

// Common grammar/function words. Used ONLY to label explanation quality,
// never to change the classifier's prediction.
const FUNCTION_WORDS = new Set([
  "है","हैं","था","थी","थे","और","के","का","की","को","से","में","पर","भी","तो","ही","नहीं","न","ना",
  "वो","वह","यह","ये","उसे","उसको","उसका","उसकी","उनको","अभी","कुछ","कोई","बहुत","एक","जो","कि","लिए","रहा","रही","रहे","करते","करती","करता","वाले","वाली","वाला",
  "hai","hain","h","tha","thi","aur","ke","ka","ki","ko","se","me","mein","pe","par","bhi","to","hi","nahi","nai","na",
  "wo","woh","ye","usko","use","uska","unko","abhi","kuch","koi","bahut","ek","jo","ki","liye","raha","rahi","rhe","kar","kr","wale","wali","wala","plus"
]);

function wordFeatures(word) {
  const f = new Set(["w:" + word]);
  const chars = Array.from("<" + word + ">");
  for (const n of [2, 3, 4]) {
    for (let i = 0; i + n <= chars.length; i++) f.add("c:" + chars.slice(i, i + n).join(""));
  }
  return f;
}

/**
 * @param prepared  result of prepare(model)
 * @param note      the worker's note (same text passed to classify)
 * @param maxWords  how many evidence words to return per label
 * @returns { [label]: { evidence: [{word, contribution}], weak: boolean, mostly_grammar_words: boolean } }
 * Contributions are relative scores for ranking only; do not display them as numbers or percentages.
 */
export function explain(prepared, note, maxWords = 3) {
  const m = prepared;
  const words = normalise(note).split(" ").filter(Boolean);
  // Same feature set and scaling as classify(): unique matched features, value 1/sqrt(n)
  const featToWords = new Map();
  for (const w of new Set(words)) {
    for (const f of wordFeatures(w)) {
      if (!m.index.has(f)) continue;
      if (!featToWords.has(f)) featToWords.set(f, []);
      featToWords.get(f).push(w);
    }
  }
  const n = featToWords.size;
  const value = n ? 1 / Math.sqrt(n) : 0;
  const out = {};
  m.labels.forEach((label, j) => {
    const score = new Map();
    for (const [f, ws] of featToWords) {
      const c = (m.weights[j][m.index.get(f)] * value) / ws.length; // shared n-grams split equally
      for (const w of ws) score.set(w, (score.get(w) || 0) + c);
    }
    const ranked = [...score.entries()].filter(([, c]) => c > 0.05).sort((a, b) => b[1] - a[1]);
    const content = ranked.filter(([w]) => !FUNCTION_WORDS.has(w));
    const evidence = content.slice(0, maxWords)
      .map(([word, c]) => ({ word, contribution: Math.round(c * 100) / 100 }));
    // Weak = no meaningful (non-grammar) word supports this label strongly,
    // or grammar words outweigh the content words.
    const contentTotal = content.reduce((a, [, c]) => a + c, 0);
    const functionTotal = ranked.filter(([w]) => FUNCTION_WORDS.has(w)).reduce((a, [, c]) => a + c, 0);
    const weak = evidence.length === 0 || evidence[0].contribution < 0.8 || functionTotal > contentTotal;
    out[label] = {
      evidence,   // show these words to the worker
      weak,       // if true, show: "Evidence is weak — ask before confirming."
      mostly_grammar_words: functionTotal > contentTotal
    };
  });
  return out;
}

/**
 * Suggest which barrier to clarify next with a fixed voice prompt.
 * Uses only the classifier's existing output (results from classify()).
 * Returns the "possible" label closest to its threshold, or null.
 */
export function askNext(classification) {
  const candidates = classification.results
    .filter(r => r.status === "possible")
    .sort((a, b) => (b.probability - b.threshold) - (a.probability - a.threshold));
  return candidates.length ? candidates[0].label : null;
}
