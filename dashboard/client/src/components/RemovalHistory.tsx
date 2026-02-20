import { useEffect, useState } from "react";
import { Loader2, AlertCircle, History, ExternalLink } from "lucide-react";
import { fetchHistory } from "../api/devin";
import type { HistoryEntry } from "../api/devin";

export default function RemovalHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetchHistory()
        .then((data) => {
          setEntries(data);
          setError(null);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 text-red-600">
        <AlertCircle className="mr-2 h-5 w-5" />
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <History className="mb-3 h-10 w-10" />
        <p className="text-sm">
          No flags have been removed yet. Remove a flag to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Flag Name
            </th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Removed At
            </th>
            <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              PR Link
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => (
            <tr key={`${entry.flagName}-${i}`} className="border-b border-gray-100 last:border-0">
              <td className="px-6 py-4">
                <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-gray-900">
                  {entry.flagName}
                </code>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    entry.flagStatus === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {entry.flagStatus}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(entry.removedAt).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                {entry.prUrl ? (
                  <a
                    href={entry.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    View PR
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-sm text-gray-400">--</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
