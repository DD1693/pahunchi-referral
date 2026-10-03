import { Check, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { FOLLOW_UP_ACTIONS, HOUSEHOLD_PRIVACY_NOTICE } from "@/lib/followupSupport";
import { AudioPromptButton, BARRIER_PROMPTS } from "@/components/AudioPromptButton";
import { updateReferral } from "@/lib/store";
import { barrierMeta, type BarrierLabel, type PlannedAction, type Referral } from "@/lib/types";

/** Shown only for HUMAN-CONFIRMED barriers. Selection is optional; nothing is pre-selected or sent anywhere. */
export function FollowUpSupport({ r, onDone, doneLabel = "Skip for now" }: { r: Referral; onDone: () => void; doneLabel?: string }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const key = (b: BarrierLabel, a: string) => `${b}::${a}`;
  const toggle = (k: string) => {
    const n = new Set(sel);
    if (n.has(k)) n.delete(k);
    else n.add(k);
    setSel(n);
  };

  if (r.confirmedBarriers.length === 0) return null;

  async function save() {
    setSaving(true);
    const at = new Date().toISOString();
    const actions: PlannedAction[] = [...sel].map((k) => {
      const [barrier, action] = k.split("::") as [BarrierLabel, string];
      return { barrier, action, at };
    });
    await updateReferral(
      r,
      { plannedActions: [...(r.plannedActions ?? []), ...actions] },
      { type: "action_planned", at, detail: actions.map((a) => a.action).join("; ") },
    );
    onDone();
  }

  return (
    <section aria-labelledby="fus-h" className="surface space-y-4 p-4">
      <div>
        <h2 id="fus-h" className="text-lg font-bold">Follow-up support</h2>
        <p className="text-sm font-medium">Fixed follow-up prompts — not AI-generated. The health worker decides.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          These are non-clinical prompts, not medical advice. Choose what is appropriate after speaking with the patient.
        </p>
      </div>

      {r.confirmedBarriers.map((b) => (
        <fieldset key={b} className="space-y-2">
          <legend className="mb-2">
            <span className="block font-semibold">{barrierMeta(b).en}</span>
            <span lang="hi" className="hindi block text-sm text-muted-foreground">{barrierMeta(b).hi}</span>
          </legend>
          <AudioPromptButton src={BARRIER_PROMPTS[b]} />
          {b === "household_constraint" && (
            <p className="flex items-start gap-2 rounded-xl border border-attention/50 bg-attention-soft p-3 text-sm font-semibold text-attention-foreground">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden /> {HOUSEHOLD_PRIVACY_NOTICE}
            </p>
          )}
          <ul className="space-y-2">
            {FOLLOW_UP_ACTIONS[b].map((a) => {
              const k = key(b, a);
              const on = sel.has(k);
              return (
                <li key={k}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(k)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl border-2 p-3 text-left text-sm ${on ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    <span aria-hidden className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${on ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                      {on && <Check className="h-4 w-4" />}
                    </span>
                    {a}
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn-primary flex-1" disabled={sel.size === 0 || saving} onClick={save}>
          Save selected actions
        </button>
        <button type="button" className="btn-secondary flex-1" onClick={onDone}>
          {doneLabel}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">Optional. Pahunchi never contacts anyone automatically.</p>
    </section>
  );
}
