const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface FeatureFlag {
  name: string;
  status: string;
  description: string;
}

export interface SessionResponse {
  session_id: string;
  url: string;
  status?: string;
}

export interface SessionDetails {
  session_id: string;
  url: string;
  status: string;
  pull_request?: { url: string } | null;
}

export async function fetchFlags(): Promise<FeatureFlag[]> {
  const res = await fetch(`${API_BASE}/api/flags`);
  if (!res.ok) {
    throw new Error("Failed to fetch flags");
  }
  return res.json();
}

export async function fetchSessionStatus(
  sessionId: string
): Promise<SessionDetails> {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch session status");
  }
  return res.json();
}

export interface HistoryEntry {
  flagName: string;
  flagStatus: string;
  removedAt: string;
  prUrl: string | null;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const res = await fetch(`${API_BASE}/api/history`);
  if (!res.ok) {
    throw new Error("Failed to fetch removal history");
  }
  return res.json();
}

export async function addHistoryEntry(
  flagName: string,
  flagStatus: string,
  prUrl?: string
): Promise<HistoryEntry> {
  const res = await fetch(`${API_BASE}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flagName, flagStatus, prUrl }),
  });
  if (!res.ok) {
    throw new Error("Failed to add history entry");
  }
  return res.json();
}

export async function createRemovalSession(
  flagName: string
): Promise<SessionResponse> {
  const res = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flagName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Failed to create session");
  }
  return res.json();
}
