import { Link } from "@tanstack/react-router";
import { BarChart3, Building2, Home, ListChecks, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { ConnectivityBadge } from "./ConnectivityBadge";
import { RouteMark } from "./RouteMotif";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/referrals", label: "Referrals", icon: ListChecks },
  { to: "/new", label: "New Referral", icon: Plus },
  { to: "/arrival", label: "Confirm arrival", icon: Building2 },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg" aria-label="Pahunchi home">
            <RouteMark className="h-8 w-8" />
            <span className="text-lg font-bold tracking-tight">Pahunchi</span>
          </Link>
          <ConnectivityBadge />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground"
                activeProps={{ className: "text-primary", "aria-current": "page" }}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`flex h-8 w-12 items-center justify-center rounded-full ${isActive ? "bg-primary-soft" : ""}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    {label}
                  </>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
