# Agent-User Feedback — Remaining Notes

## Remaining Architectural Notes

These are lower-priority items identified during the review that haven't been addressed yet. None are blockers.

### 1. `HelperFunctions.js` mutates input arguments
- Functions like `abortProcess`, `removeFinishedProcess`, `startProcessExecution` receive arrays and objects, then **mutate them in-place** while also returning them.
- This makes the data flow unpredictable — callers can't tell if their local copies changed.
- **Recommendation**: Return new copies; never mutate inputs.

### 2. Algorithm modules still mutate state via `scheduler` reference
- The extracted algorithm files (`src/algorithms/*.js`) receive the Scheduler component instance and call `scheduler.setState()` directly, plus mutate local copies of arrays/objects.
- This is functional but tightly couples the algorithms to the React component's internals.
- **Recommendation**: Long-term, algorithms could be pure functions that take state in and return new state out, with the component handling `setState` in one place.

### 3. Navigation via `this.props.history` inside setTimeout callbacks
- Pushing routes inside `setTimeout` callbacks after the simulation ends is fragile. The `_unmounted` guard mitigates crashes, but the pattern is still brittle.
- **Recommendation**: Use a "simulation complete" state flag and handle navigation in render/lifecycle instead.

### 4. No input validation beyond HTML attributes
- No validation on the AlgorithmSelector inputs beyond HTML `min`/`max`/`required`.
- Users could potentially enter edge-case values (0 cores, 0 processes) that break the simulation.
- **Recommendation**: Add explicit validation before starting the simulation.

### 5. jQuery dependency is unused
- `jquery` is listed as a dependency but never imported in any source file.
- **Recommendation**: Remove it (`npm uninstall jquery`).

---

## Completed Work Log (Summary)

| Phase | What | Key Changes |
|---|---|---|
| **Phase 1** | Get it running | Downgraded react-router-dom to v5, removed node-sass/gulp, upgraded react-scripts to 5.x |
| **Phase 2** | Stabilize | Fixed state mutations, added timeout cleanup, added ErrorBoundary |
| **Phase 3** | Refactor | Extracted 4 algorithm modules, deduplicated ProcessQueues + merge logic, removed dead code |
| **Context migration** | Replace Redux | Replaced Redux + Immutable.js + 5 support packages with single AlgorithmContext (~50 lines) |
| **Vite migration** | Fix vulnerabilities | Replaced CRA (react-scripts) with Vite — 0 npm vulnerabilities, ~50x faster builds |
| **Deploy** | GitHub Pages | Deployed via gh-pages, switched to HashRouter for GH Pages compatibility |
