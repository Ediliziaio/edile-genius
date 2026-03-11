

## AgentDetail Refactor — Anti-Pattern Removal

### Anti-Patterns Found

| # | Location | Issue |
|---|----------|-------|
| 1 | **Line 136** `if (agent && !cfg) setCfg(buildConfigState(agent))` | **setState during render** — causes double render, breaks StrictMode, fragile on refetch |
| 2 | **Line 117** `useState<ConfigState | null>(null)` | Config starts `null`, initialized lazily during render instead of derived from query data |
| 3 | Lines 228, 322, 421, 442 guard with `{cfg && ...}` | Consequence of #2 — entire tab bodies conditionally render on nullable state that should never be null when agent exists |

### Fix Strategy

**Replace the `cfg` state + render-time init with a proper pattern:**

1. Remove `const [cfg, setCfg] = useState<ConfigState | null>(null)` and the line 136 render-time setState
2. Use `useState` initialized lazily from a `useEffect` that fires when `agent` data arrives
3. Use `useEffect` with `agent` as dependency — only set initial config when agent first loads (not on every refetch, preserving dirty edits)
4. Keep `dirty` flag to prevent refetch from overwriting user edits

**Concrete implementation:**

```typescript
// Replace lines 117-119 and 136 with:
const [cfg, setCfg] = useState<ConfigState | null>(null);
const [dirty, setDirty] = useState(false);
const [initializedForId, setInitializedForId] = useState<string | null>(null);

// Proper initialization via useEffect
useEffect(() => {
  if (agent && agent.id !== initializedForId) {
    setCfg(buildConfigState(agent));
    setDirty(false);
    setInitializedForId(agent.id);
  }
}, [agent, initializedForId]);
```

This approach:
- Moves setState out of the render body into a `useEffect`
- Uses `initializedForId` to ensure config is only built once per agent ID (not on every refetch)
- Preserves dirty edits when React Query refetches in background
- Handles navigation between different agents correctly (different `id` triggers re-init)
- Removes the need for `{cfg && ...}` guards since cfg will be set before first meaningful render completes

### Files Modified
1. `src/pages/app/AgentDetail.tsx` — single file, surgical edit

### Changes Summary
- Add `useEffect` import (already imported? no — line 6 imports `useState, useCallback` only)
- Add `useEffect` to imports
- Replace state init + render-time setState with `useEffect`-based initialization
- Add `initializedForId` tracking state
- Remove line 136 (`if (agent && !cfg) setCfg(...)`)

### Manual Test Checklist
- Open agent detail → config loads correctly
- Edit fields → dirty flag appears, floating save bar shows
- Save → changes persist, dirty clears
- Navigate to different agent → config resets to new agent's data
- Refresh page → config loads from fresh query
- Background refetch (focus window) → dirty edits preserved
- No console warnings about setState during render

