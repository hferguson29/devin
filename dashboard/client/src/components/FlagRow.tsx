import { useState, useEffect, useRef, useCallback } from "react";
import { ExternalLink, Loader2, GitPullRequest } from "lucide-react";
import StatusBadge from "./StatusBadge";
import ConfirmModal from "./ConfirmModal";
import { createRemovalSession, fetchSessionStatus, addHistoryEntry } from "../api/devin";
import type { FeatureFlag } from "../api/devin";

import type { ResolvedFlag } from "../App";

interface FlagRowProps {
  flag: FeatureFlag;
  resolved?: ResolvedFlag;
  onResolved: (flagName: string, prUrl: string, sessionUrl: string) => void;
}

type SessionState =
  | { kind: "idle" }
  | { kind: "confirm" }
  | { kind: "loading" }
  | { kind: "polling"; url: string; sessionId: string; status: string; prUrl?: string }
  | { kind: "complete"; url: string; sessionId: string; prUrl?: string }
  | { kind: "failed"; url: string; sessionId: string; reason?: string }
  | { kind: "error"; message: string };

const POLL_INTERVAL = 5000;

function sessionStatusLabel(status: string): string {
  switch (status) {
    case "running":
    case "blocked":
      return "Running";
    case "stopped":
    case "finished":
      return "Complete";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function sessionStatusColor(status: string): string {
  switch (status) {
    case "running":
    case "blocked":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "stopped":
    case "finished":
      return "bg-green-50 text-green-700 ring-green-200";
    default:
      return "bg-yellow-50 text-yellow-700 ring-yellow-200";
  }
}

export default function FlagRow({ flag, resolved, onResolved }: FlagRowProps) {
  const [session, setSession] = useState<SessionState>(() =>
    resolved ? { kind: "complete", url: resolved.sessionUrl, sessionId: "", prUrl: resolved.prUrl } : { kind: "idle" }
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInFlightRef = useRef(false);
  const terminalHandledRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (sessionId: string, url: string) => {
      stopPolling();
      terminalHandledRef.current = false;
      intervalRef.current = setInterval(async () => {
        if (pollInFlightRef.current || terminalHandledRef.current) return;
        pollInFlightRef.current = true;
        try {
          const details = await fetchSessionStatus(sessionId);
          const prUrl = details.pull_request?.url;

          if (prUrl) {
            terminalHandledRef.current = true;
            stopPolling();
            setSession({ kind: "complete", url, sessionId, prUrl });
            onResolved(flag.name, prUrl, url);
            addHistoryEntry(flag.name, flag.status, prUrl).catch(() => {});
          } else if (
            details.status === "stopped" ||
            details.status === "finished"
          ) {
            terminalHandledRef.current = true;
            stopPolling();
            setSession({ kind: "failed", url, sessionId, reason: "Session finished without a PR URL." });
          } else if (
            details.status === "failed" ||
            details.status === "error"
          ) {
            terminalHandledRef.current = true;
            stopPolling();
            setSession({ kind: "failed", url, sessionId });
          } else {
            setSession({
              kind: "polling",
              url,
              sessionId,
              status: details.status,
              prUrl,
            });
          }
        } catch {
          // keep polling on transient errors
        } finally {
          pollInFlightRef.current = false;
        }
      }, POLL_INTERVAL);
    },
    [stopPolling, onResolved, flag.name, flag.status]
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const handleRemove = async () => {
    setSession({ kind: "loading" });
    try {
      const data = await createRemovalSession(flag.name);
      setSession({
        kind: "polling",
        url: data.url,
        sessionId: data.session_id,
        status: "pending",
      });
      startPolling(data.session_id, data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSession({ kind: "error", message });
    }
  };

  const isTerminal =
    session.kind === "complete" ||
    session.kind === "failed" ||
    session.kind === "polling";

  return (
    <>
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
        <td className="px-6 py-4">
          <div className="flex flex-col items-end gap-2">
            {session.kind === "idle" && (
              <button
                onClick={() => setSession({ kind: "confirm" })}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            )}

            {session.kind === "confirm" && (
              <button
                disabled
                className="rounded-md bg-red-400 px-4 py-2 text-sm font-medium text-white cursor-not-allowed"
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

            {session.kind === "polling" && (
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ${sessionStatusColor(session.status)}`}
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {sessionStatusLabel(session.status)}
                </span>
                <a
                  href={session.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  View session
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {session.kind === "complete" && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  {session.prUrl ? "PR Opened" : "Complete"}
                </span>
                {session.prUrl && (
                  <a
                    href={session.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 ring-1 ring-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    <GitPullRequest className="h-3.5 w-3.5" />
                    View PR
                  </a>
                )}
                <a
                  href={session.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  View session
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {session.kind === "failed" && (
              <div className="flex flex-col items-end gap-1.5">
                <span className="inline-flex items-center rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                  Failed
                </span>
                {session.reason && (
                  <span className="text-xs text-red-500">{session.reason}</span>
                )}
                <a
                  href={session.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  View session
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {session.kind === "error" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">{session.message}</span>
                <button
                  onClick={() => setSession({ kind: "confirm" })}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {isTerminal && (
              <span className="text-xs text-gray-400">
                Removal {session.kind === "polling" ? "in progress" : session.kind}
              </span>
            )}
          </div>
        </td>
      </tr>

      {session.kind === "confirm" && (
        <ConfirmModal
          flagName={flag.name}
          flagStatus={flag.status}
          onConfirm={handleRemove}
          onCancel={() => setSession({ kind: "idle" })}
        />
      )}
    </>
  );
}
