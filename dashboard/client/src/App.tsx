import { useState, useCallback, useEffect } from "react";
import { Github } from "lucide-react";
import FlagTable from "./components/FlagTable";
import RemovalHistory from "./components/RemovalHistory";
import { fetchHistory } from "./api/devin";

type Tab = "flags" | "history";

export interface ResolvedFlag {
  prUrl: string;
  sessionUrl: string;
}

function App() {
  const [tab, setTab] = useState<Tab>("flags");
  const [resolvedFlags, setResolvedFlags] = useState<Record<string, ResolvedFlag>>({});

  const onFlagResolved = useCallback((flagName: string, prUrl: string, sessionUrl: string) => {
    setResolvedFlags((prev) => ({ ...prev, [flagName]: { prUrl, sessionUrl } }));
  }, []);

  useEffect(() => {
    fetchHistory()
      .then((entries) => {
        const seed: Record<string, ResolvedFlag> = {};
        for (const entry of entries) {
          if (entry.prUrl) {
            seed[entry.flagName] = { prUrl: entry.prUrl, sessionUrl: "" };
          }
        }
        setResolvedFlags((prev) => ({ ...seed, ...prev }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Feature Flag Removal Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Select a feature flag below to trigger Devin to remove it from the
            codebase and open a pull request automatically.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Github className="h-3.5 w-3.5" />
            Connected to:{" "}
            <a
              href="https://github.com/hferguson29/devin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 underline"
            >
              hferguson29/devin
            </a>
          </p>
        </div>

        <div className="mb-6 flex gap-1 border-b border-gray-200">
          <button
            onClick={() => setTab("flags")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "flags"
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Feature Flags
          </button>
          <button
            onClick={() => setTab("history")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "history"
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Removal History
          </button>
        </div>

        <div className={tab !== "flags" ? "hidden" : ""}>
          <FlagTable resolvedFlags={resolvedFlags} onFlagResolved={onFlagResolved} />
        </div>
        <div className={tab !== "history" ? "hidden" : ""}>
          <RemovalHistory />
        </div>
      </div>
    </div>
  );
}

export default App;
