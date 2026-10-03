import { CloudOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

export function useOnline(): boolean | null {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    const up = () => setOnline(navigator.onLine);
    up();
    window.addEventListener("online", up);
    window.addEventListener("offline", up);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", up);
    };
  }, []);
  return online;
}

export function ConnectivityBadge() {
  const online = useOnline();
  if (online === null) return <span className="h-8 w-24" aria-hidden />;
  return (
    <span
      role="status"
      className={`chip py-1.5 text-sm ${online ? "bg-success-soft text-success" : "bg-primary-soft text-accent-foreground"}`}
    >
      {online ? <Wifi className="h-4 w-4" aria-hidden /> : <CloudOff className="h-4 w-4" aria-hidden />}
      {online ? "Online" : "Offline ready"}
    </span>
  );
}
