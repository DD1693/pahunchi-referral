import { AlertTriangle, Check, HelpCircle, Smartphone, Sparkles, UserCheck } from "lucide-react";
import { useMemo } from "react";
import { analyseNote, askNextLabel, explainNote, modelReady, type ClassifyResult } from "@/lib/sahaay";
import { BARRIERS, barrierMeta, type BarrierLabel } from "@/lib/types";
import { AudioPromptButton, BARRIER_PROMPTS, OPENING_PROMPT } from "@/components/AudioPromptButton";

export interface ReviewState {
  result: ClassifyResult | null;
  analysedNote: string;
  confirmed: BarrierLabel[];
  noBarrier: boolean;
  error: string | null;
}
export const emptyReview = (confirmed: BarrierLabel[] = []): ReviewState => ({
  result: null,
  analysedNote: "",
  confirmed,
  noBarrier: false,
  error: null,
});
export const reviewComplete = (r: ReviewState) => r.confirmed.length > 0 || r.noBarrier;

const EXAMPLES = [
  "अस्पताल दूर है और आने-जाने के पैसे नहीं हैं",
  "pati ne mana kar diya, ghar se permission nahi mili",
  "Operation se dar lagta hai, wahan jaane me jhijhak hai",
];

export function NotSure() {
  return (
    <div className="rounded-xl border border-attention/40 bg-attention-soft p-4" role="status">
      <p className="flex items-start gap-2 font-semibold text-attention-foreground">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        Not sure — ask the patient for more information.
      </p>
      <p lang="hi" className="hindi mt-1 pl-7 text-attention-foreground">
        स्पष्ट नहीं है — मरीज से और जानकारी पूछें।
      </p>
    </div>
  );
}

export function BarrierReview({
  note,
  setNote,
  review,
  setReview,
}: {
  note: string;
  setNote: (s: string) => void;
  review: ReviewState;
  setReview: (r: ReviewState) => void;
}) {
  const ready = modelReady();

  function run() {
    try {
      const result = analyseNote(note);
      setReview({ ...review, result, analysedNote: note, error: null });
    } catch (e) {
      console.error(e);
      setReview({
        ...review,
        error: ready
          ? "Barrier analysis could not run. Your referral information has not been lost. Please try again."
          : "Offline AI model could not be loaded.",
      });
    }
  }

  function toggle(l: BarrierLabel) {
    const has = review.confirmed.includes(l);
    setReview({
      ...review,
      noBarrier: false,
      confirmed: has ? review.confirmed.filter((x) => x !== l) : [...review.confirmed, l],
    });
  }

  const statusOf = (l: BarrierLabel) => review.result?.results.find((r) => r.label === l)?.status;
  const stale = review.result && review.analysedNote !== note;
  const noneDetected = review.result && review.result.detected.length === 0;

  // Explanations come only from pahunchi_explain.js (real model weights), on the analysed note.
  const explanation = useMemo(() => {
    if (!review.result || !ready) return null;
    try {
      return explainNote(review.analysedNote);
    } catch {
      return null;
    }
  }, [review.result, review.analysedNote, ready]);
  const nextLabel = useMemo(() => {
    if (!review.result) return null;
    const l = askNextLabel(review.result);
    return l && l in BARRIER_PROMPTS ? (l as BarrierLabel) : null;
  }, [review.result]);

  function focusNote() {
    const el = document.getElementById("barrier-note") as HTMLTextAreaElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }

  return (
    <section aria-labelledby="note-h" className="space-y-4">
      <div>
        <h2 id="note-h" className="text-xl font-bold leading-snug">
          What might make this referral difficult to complete?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Write a short note based on what the patient tells you. Hindi, Roman Hindi and limited Hinglish are
          supported in this prototype.
        </p>
      </div>

      {!ready && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive-soft p-3 font-semibold text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden /> Offline AI model could not be loaded.
        </p>
      )}

      <div>
        <label htmlFor="barrier-note" className="field-label">
          Barrier note
        </label>
        <textarea
          id="barrier-note"
          lang="hi"
          rows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="उदाहरण: अस्पताल दूर है और आने-जाने के पैसे नहीं हैं…"
          className="field hindi min-h-36 py-3 text-lg"
        />
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <AudioPromptButton src={OPENING_PROMPT} />
          <span className="text-xs text-muted-foreground">Optional pre-recorded prompt. No patient audio is recorded.</span>
        </div>

        <div className="mt-2">
          <p className="eyebrow mb-1.5">Example notes — tap to try</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                lang="hi"
                onClick={() => setNote(ex)}
                className="hindi rounded-full border border-dashed border-input px-3 py-1.5 text-left text-sm text-muted-foreground hover:border-primary hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={run} disabled={!note.trim() || !ready}>
          <Sparkles className="h-5 w-5" aria-hidden />
          {review.result ? "Analyse again on this device" : "Analyse on this device"}
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Smartphone className="h-4 w-4" aria-hidden /> Runs locally — no internet required
        </span>
      </div>

      {review.error && (
        <p role="alert" className="rounded-xl bg-destructive-soft p-3 text-sm font-medium text-destructive">
          {review.error}
        </p>
      )}

      {review.result && (
        <div className="surface space-y-4 p-4" aria-live="polite">
          <div>
            <h3 className="text-lg font-bold">AI suggestions — please confirm</h3>
            <p className="text-sm text-muted-foreground">
              The AI may be wrong. Confirm or correct the barriers before saving.
            </p>
            {stale && (
              <p className="mt-2 text-sm font-medium text-attention-foreground">
                The note has changed since analysis. Analyse again to refresh suggestions.
              </p>
            )}
          </div>

          {noneDetected && <NotSure />}

          {nextLabel && (
            <div className="rounded-xl border border-attention/40 bg-attention-soft p-4 space-y-2">
              <p className="font-semibold text-attention-foreground">One thing is unclear: {barrierMeta(nextLabel).en}</p>
              <p className="text-sm text-attention-foreground">Ask one more question:</p>
              <AudioPromptButton src={BARRIER_PROMPTS[nextLabel]} />
              <div>
                <button type="button" className="btn-secondary min-h-10 text-sm" onClick={focusNote}>
                  Add answer to note and analyse again
                </button>
              </div>
            </div>
          )}

          <fieldset>
            <legend className="eyebrow mb-2">Tap to confirm each barrier you agree with</legend>
            <ul className="space-y-2">
              {BARRIERS.map((b) => {
                const st = statusOf(b.label);
                const on = review.confirmed.includes(b.label);
                return (
                  <li key={b.label}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(b.label)}
                      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${on ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40"}`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
                      >
                        {on && <Check className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">{b.en}</span>
                        <span lang="hi" className="hindi block text-sm text-muted-foreground">
                          {b.hi}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {st === "detected" && (
                          <span className="chip-ai">
                            <Sparkles className="h-3 w-3" aria-hidden /> Suggested barrier
                          </span>
                        )}
                        {st === "possible" && <span className="chip-ai bg-transparent ring-1 ring-ai/40">Possible barrier</span>}
                        {on && (
                          <span className="chip-human">
                            <UserCheck className="h-3 w-3" aria-hidden /> Human confirmed
                          </span>
                        )}
                      </span>
                    </button>
                    {(st === "detected" || st === "possible") && explanation?.[b.label] && (
                      <div className="mt-1.5 px-3 text-sm">
                        {explanation[b.label].evidence.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-muted-foreground">Words from the note:</span>
                            {explanation[b.label].evidence.map((e) => (
                              <span key={e.word} lang="hi" className="hindi rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground">
                                {e.word}
                              </span>
                            ))}
                          </div>
                        )}
                        {explanation[b.label].weak && (
                          <p className="mt-1 text-attention-foreground">Evidence is weak — check with the patient before confirming.</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <button
            type="button"
            role="checkbox"
            aria-checked={review.noBarrier}
            onClick={() => setReview({ ...review, noBarrier: !review.noBarrier, confirmed: [] })}
            className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${review.noBarrier ? "border-primary bg-primary-soft" : "border-dashed border-input"}`}
          >
            <span
              aria-hidden
              className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${review.noBarrier ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}
            >
              {review.noBarrier && <Check className="h-4 w-4" />}
            </span>
            <span className="font-semibold">No barrier confirmed</span>
          </button>

          <p className="text-xs text-muted-foreground">
            AI suggests. Health workers confirm. AI supports documentation. It does not make clinical decisions.
          </p>
        </div>
      )}
    </section>
  );
}
