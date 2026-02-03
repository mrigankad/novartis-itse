import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ensureRealDataLoaded, getAllTickets } from "@/data/realData";

type DataContextValue = {
  ready: boolean;
  ticketsCount: number;
  error: string | null;
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    ensureRealDataLoaded()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load data");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DataContextValue>(() => {
    return {
      ready,
      ticketsCount: ready ? getAllTickets().length : 0,
      error,
    };
  }, [ready, error]);

  if (error) {
    return (
      <div className="min-h-screen bg-dashboard-bg text-foreground flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-card border border-border rounded-xl p-6">
          <div className="text-lg font-semibold">Data Load Failed</div>
          <div className="text-sm text-muted-foreground mt-2">{error}</div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-dashboard-bg text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading data…</div>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

