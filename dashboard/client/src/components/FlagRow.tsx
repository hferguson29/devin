import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { createRemovalSession } from "../api/devin";
import type { FeatureFlag } from "../api/devin";

interface FlagRowProps {
  flag: FeatureFlag;
}

type SessionState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "started"; url: string; sessionId: string }
  | { kind: "error"; message: string };

export default function FlagRow({ flag }: FlagRowProps) {
  const [session, setSession] = useState<SessionState>({ kind: "idle" });

  const handleRemove = async () => {
    setSession({ kind: "loading" });
    try {
      const data = await createRemovalSession(flag.name);
      setSession({ kind: "started", url: data.url, sessionId: data.session_id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSession({ kind: "error", message });
    }
  };

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-6 py-4">
        <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-900">
          {flag.name}
        </code>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={flag.status} />
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">{flag.description}</td>
      <td className="px-6 py-4 text-right">
        {session.kind === "idle" && (
          <button
            onClick={handleRemove}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        )}

        {session.kind === "loading" && (
          <span className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Starting session...
          </span>
        )}

        {session.kind === "started" && (
          <a
            href={session.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700 ring-1 ring-green-200 hover:bg-green-100 transition-colors"
          >
            Session Started
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {session.kind === "error" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-600">{session.message}</span>
            <button
              onClick={handleRemove}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
