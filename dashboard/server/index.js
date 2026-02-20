const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DEVIN_API_BASE = "https://api.devin.ai/v1";
const DEVIN_API_KEY = process.env.DEVIN_API_KEY;

if (!DEVIN_API_KEY) {
  console.error("DEVIN_API_KEY is not set. Please set it in your environment.");
  process.exit(1);
}

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/hferguson29/devin/main/feature_flags.json";

const removalHistory = [];

app.get("/api/flags", async (_req, res) => {
  try {
    const response = await fetch(GITHUB_RAW_URL);
    if (!response.ok) {
      throw new Error(`GitHub fetch failed: ${response.status}`);
    }
    const flags = await response.json();
    res.json(flags);
  } catch (err) {
    console.error("Error fetching flags:", err.message);
    res.status(500).json({ error: "Failed to fetch feature flags" });
  }
});

app.post("/api/sessions", async (req, res) => {
  const { flagName } = req.body;

  if (!flagName) {
    return res.status(400).json({ error: "flagName is required" });
  }

  const prompt = `You are helping remove a feature flag from a codebase.

Flag to remove: ${flagName}

Instructions:
1. Search the entire codebase for all references to "${flagName}"
2. Remove the flag and all conditional logic that depends on it
3. If a flag evaluates to true (it was enabled), keep the code in the "true" branch and remove the "false" branch
4. If a flag evaluates to false (it was disabled), remove the "true" branch and keep the "false" branch
5. Clean up any imports, config entries, or dead code that is no longer needed
6. Open a pull request titled "Remove feature flag: ${flagName}" with a clear description of changes made

Be thorough. Check all file types including JS, TS, Python, config files, and tests.`;

  try {
    const response = await fetch(`${DEVIN_API_BASE}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DEVIN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Devin API error:", response.status, errorBody);
      return res
        .status(response.status)
        .json({ error: "Devin API request failed", details: errorBody });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error creating Devin session:", err.message);
    res.status(500).json({ error: "Failed to create Devin session" });
  }
});

app.get("/api/history", (_req, res) => {
  res.json(removalHistory);
});

app.post("/api/history", (req, res) => {
  const { flagName, flagStatus, prUrl } = req.body;
  if (!flagName) {
    return res.status(400).json({ error: "flagName is required" });
  }
  const entry = {
    flagName,
    flagStatus: flagStatus || "unknown",
    removedAt: new Date().toISOString(),
    prUrl: prUrl || null,
  };
  removalHistory.unshift(entry);
  res.json(entry);
});

app.get("/api/sessions/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  try {
    const response = await fetch(`${DEVIN_API_BASE}/session/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${DEVIN_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Devin API error:", response.status, errorBody);
      return res
        .status(response.status)
        .json({ error: "Failed to fetch session status", details: errorBody });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching session:", err.message);
    res.status(500).json({ error: "Failed to fetch session status" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
