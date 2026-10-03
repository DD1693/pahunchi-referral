import { Link } from "@tanstack/react-router";
import { Building2, CalendarClock, ChevronRight, CloudUpload } from "lucide-react";
import { displayStatus, formatDate, timing, timingLabel } from "@/lib/followup";
import { barrierMeta, type Referral } from "@/lib/types";

export function StatusPill({ r }: { r: Referral }) {
  const s = displayStatus(r);
  const cls =
    s === "Completed"
      ? "bg-success-soft text-success"
      : s === "Follow-up due" || s === "Not completed"
        ? "bg-attention-soft text-attention-foreground"
        : "bg-secondary text-secondary-foreground";
  return <span className={`chip ${cls}`}>{s}</span>;
}

export function ReferralCard({ r, showSync = false }: { r: Referral; showSync?: boolean }) {
  const tm = timing(r);
  return (
    <Link
      to="/referral"
      search={{ id: r.id }}
      className="surface flex items-stretch gap-3 p-4 transition-colors hover:border-primary/40"
    >
      <span
        aria-hidden
        className={`w-1 shrink-0 rounded-full ${tm === "overdue" ? "bg-attention" : tm === "due_today" ? "bg-attention/60" : tm === "closed" ? "bg-success/50" : "bg-primary/30"}`}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-bold tracking-tight">{r.patientId}</span>
          {r.isDemo && <span className="chip-demo">Demo</span>}
          <StatusPill r={r} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" aria-hidden /> {r.destination}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" aria-hidden /> {formatDate(r.followUpDate)}
            <span className={tm === "overdue" ? "font-semibold text-attention-foreground" : ""}>
              · {timingLabel(r)}
            </span>
          </span>
        </div>
        {(r.confirmedBarriers.length > 0 || (showSync && r.syncState === "pending")) && (
          <div className="flex flex-wrap gap-1.5">
            {r.confirmedBarriers.map((b) => (
              <span key={b} className="chip-barrier">
                {barrierMeta(b).en}
              </span>
            ))}
            {showSync && r.syncState === "pending" && (
              <span className="chip-pending">
                <CloudUpload className="h-3.5 w-3.5" aria-hidden /> Waiting to sync
              </span>
            )}
          </div>
        )}
      </div>
      <ChevronRight className="h-5 w-5 self-center text-muted-foreground" aria-hidden />
    </Link>
  );
}
