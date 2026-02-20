# Design Decisions

This document captures the reasoning behind the major architectural and UX decisions made while building the Feature Flag Removal Dashboard. It's written after the fact, with the benefit of hindsight — including the bugs we hit along the way.

## Why React + Tailwind + Express

The brief called for a simple internal tool, and the temptation with internal tools is to either over-engineer them (full Next.js app with server components, database, auth) or under-engineer them (a single HTML file with inline scripts). React + Tailwind + Express felt like the right middle ground.

React gives us component-level state management, which matters here because each flag row has its own independent lifecycle — idle, confirming, polling, complete, failed. Managing that with vanilla JS event listeners would have been painful. Tailwind keeps the styling co-located with the markup and avoids the overhead of a CSS architecture for what is ultimately a few tables and buttons. Express is the thinnest possible server layer: it proxies API calls, serves a couple of endpoints, and that's it.

We considered whether a server was necessary at all. It was — and that leads to the next decision.

## Why the API Key Lives on the Server

The Devin API key cannot be exposed to the browser. Full stop. Even in an internal tool, putting an API key in frontend code means it ends up in the network tab, in source maps, in browser history. Anyone with access to the page can extract it and make arbitrary Devin API calls.

The Express backend exists primarily to solve this problem. Every Devin API call goes through the backend, which injects the `Authorization` header server-side. The frontend never sees the key. This is a standard pattern, but it's worth calling out explicitly because the simplest version of this dashboard — a static page that calls the Devin API directly — would have been a security problem from day one.

The backend also gives us a place to store removal history in memory and to fetch the feature flags file from GitHub without CORS issues, but those are secondary benefits. The real reason the server exists is the API key.

## Why Session State Is Lifted to the Parent

This was a bug fix, not an upfront design decision, and I think that's worth being honest about.

The initial implementation stored all session state — idle, polling, complete, PR URL — inside each `FlagRow` component. This worked fine as long as the flag table stayed mounted. But the dashboard has two tabs (Feature Flags and Removal History), and switching tabs unmounts and remounts the flag table. When you switched to the history tab and back, every flag row re-initialized with `{ kind: "idle" }`, losing the fact that a session had already completed with a PR URL. Flags that were in "PR Opened" state suddenly showed a Remove button again.

The fix had two parts. First, we lifted a `resolvedFlags` map to the `App` component. When a session resolves with a PR URL, `FlagRow` calls `onResolved` to update the parent's state. When the flag table mounts, each `FlagRow` checks whether it has a `resolved` prop and initializes accordingly. This is a textbook example of React's state ownership problem: if a piece of state needs to survive a component unmounting, it can't live in that component.

Second, we changed the tab rendering from conditional (`{tab === "flags" ? <FlagTable /> : <RemovalHistory />}`) to simultaneous rendering with Tailwind's `hidden` class. Both tabs are always mounted; only one is visible. This prevents `FlagRow` components from unmounting during tab switches, which means active polling intervals survive navigation. The state lifting alone wasn't enough because it only covered the "complete" case — a flag mid-polling would still lose its interval and reset to idle on remount.

We also solved the page-refresh problem. On mount, `App` fetches the removal history from the backend and seeds `resolvedFlags` with any entries that have a PR URL. This means flags that previously had PRs opened restore to "PR Opened" state after a full refresh, as long as the backend is still running. The backend history doesn't store session URLs, so the "View session" link is hidden for hydrated flags — only the PR link matters after a refresh.

The combination of state lifting, simultaneous tab rendering, and history hydration gives us state persistence across tab switches, mid-polling navigation, and full page refreshes. Each layer solves a different failure mode, and all three are necessary.

## Why Flags Stay Visible After Removal

When a flag's removal session completes and a PR is opened, the flag does not disappear from the table. It stays visible in a "PR Opened" state with a link to the pull request. This was a deliberate choice that reflects how feature flag removal actually works.

Clicking "Remove" doesn't remove the flag. It starts a process that will, eventually, remove the flag — but only after the PR is reviewed, approved, and merged. Until that merge happens, the flag still exists in the codebase and in `feature_flags.json`. Hiding it from the dashboard would give a false sense of completion.

Keeping the flag visible with a "PR Opened" badge serves multiple purposes. It tells the team that someone has already initiated removal, so they don't trigger a duplicate session. It provides a direct link to the PR so reviewers can find it quickly. And it makes the dashboard an accurate reflection of the current state: these are your flags, here's where each one stands.

The Remove button is hidden for flags in the "PR Opened" state. There's no reason to create a second Devin session for a flag that already has a pending PR. If the PR gets closed without merging, the user would need to refresh the page (which resets the in-memory state) to trigger removal again. That felt like an acceptable tradeoff for an internal tool.

## Why Polling Instead of Webhooks

The dashboard polls the Devin API every 5 seconds to check on session progress. Webhooks would be more efficient — the server would get notified immediately when a session completes, rather than making repeated requests that mostly return the same status.

We chose polling for three reasons. First, this is a local development tool. There's no publicly accessible URL for the Devin API to send webhooks to. We'd need a tunnel (ngrok, Cloudflare Tunnel, etc.), which adds setup complexity and a runtime dependency for something that should just work out of the box.

Second, the polling approach is simpler to reason about. The frontend owns the entire lifecycle: it starts polling when a session is created, it checks the response on each cycle, and it stops when it detects completion. There's no webhook endpoint to register, no delivery failures to handle, no state synchronization between webhook events and the UI.

Third, the cost is negligible. A lightweight GET request every 5 seconds, for at most a handful of concurrent sessions, is not going to cause problems. The Devin API is doing real work (analyzing code, writing a PR), so a few extra status checks are noise in comparison.

The main tradeoff is latency: there's up to a 5-second delay between when Devin creates the PR and when the dashboard reflects it. For this use case, that's fine. If we were building a production SaaS product with hundreds of concurrent users, we'd revisit this decision.

One thing we discovered during development: Devin sessions don't transition to a "stopped" or "finished" status after creating a PR. The session stays in "running" (or "blocked") state while waiting for the PR to be reviewed. This means we can't rely on status alone to detect completion. Instead, the polling logic checks for the presence of a `pull_request.url` field in the API response. When it appears, we treat the session as done regardless of the status string. This was a real bug that took some debugging to diagnose — the frontend was originally looking for `pull_requests[0].pr_url` (plural, with a different key name) while the API actually returns `pull_request.url` (singular). The mismatch caused sessions to appear stuck on "Running" forever.

## Why the Confirmation Modal Is Dynamic

When you click Remove on a flag, the confirmation modal shows different text depending on whether the flag is active or inactive:

- Active: *"flag_name is currently active. Devin will keep the enabled code path and remove all flag conditionals, then open a PR."*
- Inactive: *"flag_name is currently inactive. Devin will keep the disabled code path and remove all flag conditionals, then open a PR."*

This matters because removing a feature flag is a destructive operation, and which code path Devin preserves depends entirely on the flag's status. An active flag means the "on" branch is the correct behavior; an inactive flag means the "off" branch is. Getting this wrong would mean shipping the wrong code to production.

The dynamic modal text serves as a final confirmation that the user understands what's about to happen. It's not just "are you sure?" — it's "here's specifically what will change, are you sure?" This is especially important in a tool where the actual code changes are made by an AI agent. The user should have a clear mental model of what they're approving before the session starts.

## Portal-Based Tooltips

The tooltips on the STATUS and ACTION column headers are rendered using React's `createPortal` to attach them to `document.body` rather than rendering them inline. This was a bug fix — the original tooltips were clipped by the table container's `overflow: hidden`.

This is a well-known problem with tooltips inside scrollable or overflow-clipped containers. The tooltip is a child of the table header cell, but its visual position extends beyond the table boundary. The browser clips it because the table's overflow rules say to. Portaling the tooltip to the body element removes it from the table's layout context entirely, so it renders on top of everything.

The tradeoff is slightly more complex positioning logic — the tooltip needs to calculate its position using `getBoundingClientRect` and account for scroll offsets — but this is a solved problem and the complexity is contained within the `Tooltip` component.

## Polling Deduplication

The polling logic uses two mutable refs — `pollInFlightRef` and `terminalHandledRef` — to prevent edge cases that emerged during testing.

`pollInFlightRef` gates the interval callback so a slow `fetchSessionStatus` response doesn't cause concurrent requests to pile up. If a poll tick fires while a previous fetch is still in flight, the tick is skipped. This is a simple form of backpressure that prevents request pileup when the Devin API is slow to respond.

`terminalHandledRef` prevents the more subtle problem of duplicate terminal handling. When a session completes (PR URL detected), the handler writes a history entry and calls `onResolved`. Without the guard, two overlapping ticks could both see the PR URL, both pass the `pollInFlightRef` gate (if the first completes just as the second starts), and both write history entries. The terminal ref ensures that once any tick handles the terminal state, all subsequent ticks are no-ops.

These are defensive measures that may never trigger in practice — the 5-second interval and typical API response times make collisions unlikely. But polling edge cases are notoriously hard to reproduce and debug, so the guards are worth their two lines of code.

## In-Memory History

Removal history is stored in a plain JavaScript array on the Express server. There's no database, no file persistence, nothing that survives a server restart. This was a deliberate choice based on the spec ("in-memory is fine, no database needed") and the nature of the tool.

The history serves as a session log, not a system of record. The real record of what happened lives in the Git history and the pull requests themselves. If the server restarts, you lose the history table, but you don't lose any actual data — every removal PR is still on GitHub.

If this tool were to evolve into something used by a larger team or across multiple sessions, we'd add a lightweight persistence layer. SQLite would be the obvious choice: zero configuration, single-file storage, and more than enough for this use case. But for an MVP internal tool, an array in memory does the job without introducing any operational complexity.
