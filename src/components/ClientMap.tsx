import { useEffect, useState } from "react";
import { LiveMap } from "./LiveMap";

// Leaflet needs window — render only on client to avoid SSR crash.
export function ClientMap(props: React.ComponentProps<typeof LiveMap>) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="h-full w-full grid place-items-center surface rounded-xl">
        <div className="text-sm text-muted-foreground font-mono">Loading map…</div>
      </div>
    );
  }
  return <LiveMap {...props} />;
}
