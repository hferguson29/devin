# demo-flags-repo

A sample repository used to demonstrate the [Feature Flag Removal Dashboard](https://github.com/YOUR_USERNAME/feature-flag-dashboard).

This repo contains a set of active and inactive feature flags along with source files that reference them across JavaScript, Python, and config layers. It's designed to be a realistic target for automated feature flag removal using Devin.

## Feature Flags

| Flag | Status | Description |
|------|--------|-------------|
| `flag_dark_mode` | active | Enables dark mode UI |
| `flag_new_checkout` | active | New checkout flow |
| `flag_beta_dashboard` | active | Beta analytics dashboard |

## File Structure

```
├── feature_flags.json     # Source of truth for all flags
├── app.js                 # Main app logic — references all flags
├── app.py                 # Python equivalent — references all flags
├── config.js              # App config derived from flag values
└── tests/
    └── app.test.js        # Tests that branch on flag state
```

## How It Works

`feature_flags.json` is the single source of truth. Each of the source files reads this file and branches logic based on whether a flag is active or inactive. When a flag is removed via the dashboard, Devin will:

1. Find all references to the flag across all files
2. Resolve conditional branches (keeping the active path, removing the inactive one)
3. Clean up dead code and config entries
4. Open a pull request with the changes
