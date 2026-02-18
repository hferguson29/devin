import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Flag } from "lucide-react";
import FlagRow from "./FlagRow";
import { fetchFlags } from "../api/devin";
import type { FeatureFlag } from "../api/devin";

export default function FlagTable() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags()
      .then(setFlags)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading flags...
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

  if (flags.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Flag className="mr-2 h-5 w-5" />
        No feature flags found.
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
              Description
            </th>
            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <FlagRow key={flag.name} flag={flag} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
