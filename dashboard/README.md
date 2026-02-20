# Feature Flag Removal Dashboard

A lightweight internal tool for managing the removal of feature flags from a codebase. Instead of manually searching for flag references, resolving conditional branches, and cleaning up dead code, this dashboard lets you trigger a Devin AI session that does all of that automatically and opens a pull request with the changes. You point it at a repository, it reads the flags, and with one click per flag, the cleanup work is handled end to end.

## How It Works

The dashboard connects to a `feature_flags.json` file hosted in a GitHub repository. On load, the backend fetches this file and the frontend renders each flag in a table showing its name, status (active or inactive), and description.

When you click **Remove** on a flag, a confirmation modal explains what Devin will do based on the flag's current status: for active flags, Devin keeps the enabled code path; for inactive flags, Devin keeps the disabled code path. After you confirm, the backend creates a Devin API session with a detailed prompt instructing Devin to find all references to the flag, remove the conditional logic, clean up dead code, and open a pull request.

The frontend then polls the Devin API every 5 seconds to track the session's progress. Polling is deduplicated so overlapping ticks never produce concurrent requests or duplicate history writes. Once Devin creates a pull request, the dashboard detects the PR URL in the API response, stops polling, and transitions the flag to a permanent "PR Opened" state with a direct link to the PR. The flag stays visible in this state so the team can see which flags have pending removal PRs. The removal is also logged to an in-memory history that's viewable in the Removal History tab.

State is persisted across both tab switches and full page refreshes. Both tabs are rendered simultaneously (toggled with CSS) so active polling survives tab navigation. On page load, the app hydrates resolved flag state from the backend removal history, restoring "PR Opened" badges for any flags that were previously removed.

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (via Vite)
- **Backend:** Node.js + Express
- **AI:** Devin API for automated code removal and PR creation
- **Icons:** Lucide React

## Running Locally

**Prerequisites:** Node.js 18+ and a Devin API key.

1. Clone the repository and navigate to the dashboard directory:

   ```bash
   cd dashboard
   ```

2. Install dependencies for both the server and client:

   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. Start the backend (Terminal 1):

   ```bash
   cd dashboard/server
   DEVIN_API_KEY=<your_key> npm start
   ```

   The server starts on `http://localhost:3001`.

4. Start the frontend (Terminal 2):

   ```bash
   cd dashboard/client
   npm run dev
   ```

   The app opens at `http://localhost:5173`.

5. Open `http://localhost:5173` in your browser. You should see the list of feature flags. Click Remove on any flag to trigger a real Devin session.

## Demo

[Watch the demo](#)

## Project Structure

```
dashboard/
  server/
    index.js              Express server: proxies Devin API, fetches flags from GitHub, manages history
    package.json          Backend dependencies (express, cors, dotenv)
  client/
    src/
      App.tsx             Root component: tab rendering, resolved flag state management, history hydration
      api/
        devin.ts          API client: typed fetch functions for flags, sessions, and history
      components/
        FlagTable.tsx     Table container: fetches flags, renders column headers with tooltips
        FlagRow.tsx       Individual flag row: Remove button, polling, session state UI
        ConfirmModal.tsx  Confirmation dialog: dynamic messaging based on flag status
        StatusBadge.tsx   Active/inactive status pill
        Tooltip.tsx       Portal-based tooltip: renders via createPortal to escape overflow
        RemovalHistory.tsx  History tab: table of completed removals with PR links
      index.css           Tailwind base styles
      main.tsx            Vite entry point
    index.html            HTML shell
    tailwind.config.js    Tailwind configuration
    vite.config.ts        Vite configuration with API proxy
  .env.example            Example environment variables
```
