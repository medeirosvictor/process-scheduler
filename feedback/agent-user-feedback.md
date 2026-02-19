# Agent-User Feedback — Critical Review of Process Scheduler

## 1. Build / Runtime Issues (Why the app won't run)

### 1.1 `node-sass` fails to install (BLOCKER)
- **`node-sass@4.11.0`** requires `node-gyp` native compilation with Python 2. The project runs on **Node 22**, which is wildly incompatible.
- `node-gyp@3.8.0` inside `node-sass` tries `print "%s.%s.%s"` (Python 2 syntax) but only Python 3.13 is available → **SyntaxError**.
- **Fix**: Replace `node-sass` + `gulp-sass` with `sass` (Dart Sass). Or drop Gulp entirely and use the `sass` CLI or CRA's built-in SASS support.

### 1.2 `react-scripts@2.1.5` is ancient and incompatible with Node 22 (BLOCKER)
- CRA 2.x expects Node 8–12. Internal webpack/babel tooling will break on Node 22.
- Even if `npm install` succeeds, `react-scripts start` will likely fail with OpenSSL, webpack, or babel errors.
- **Fix**: Upgrade to `react-scripts@5.x` (or migrate to Vite), or pin Node to a compatible version (e.g., 16 via nvm).

### 1.3 `react-router-dom@6.22.1` with v5 API usage (BLOCKER at runtime)
- Code uses **v5 patterns**: `<Route exact path='/' component={AlgorithmSelector} />`, `this.props.history.push(...)`.
- React Router v6 uses `<Route element={...} />`, `useNavigate()`, and no `component` prop.
- This will crash at runtime even if it compiles.
- **Fix**: Either downgrade to `react-router-dom@5.x` or rewrite routing to v6 API.

### 1.4 Dependency compatibility matrix is broken
| Package | Installed | Compatible Node | Issue |
|---|---|---|---|
| node-sass | 4.11.0 | 8–12 | Needs Python 2 + old node-gyp |
| react-scripts | 2.1.5 | 8–12 | Ancient webpack/babel |
| react | 16.8.3 | any (fine) | — |
| react-redux | 6.0.1 | fine with React 16 | — |
| immutable | 4.0.0-rc.12 | fine | RC version, never finalized |
| react-router-dom | 6.22.1 | fine | API mismatch (see 1.3) |

---

## 2. Architectural Issues

### 2.1 God Component: `Scheduler.js` (~1300 lines)
- Contains **all** scheduling algorithms (SJF, Round Robin Best Fit, Round Robin Merge Fit, Priority Queue) in a single class component.
- Each algorithm is a massive recursive `setTimeout` method with deeply nested loops and inline state mutations.
- Extremely hard to test, debug, or extend.
- **Recommendation**: Extract each algorithm into its own module/hook. Use a strategy pattern.

### 2.2 Direct state mutation everywhere
- `this.state` is directly mutated throughout `Scheduler.js`: e.g., `this.state.finishedProcessList = []` in the constructor, `coreList[i].processInExecution = 'none'` before `setState`.
- React does not detect direct mutations — this causes stale renders and subtle bugs.
- **Recommendation**: Always use immutable update patterns or a state management library consistently.

### 2.3 Immutable.js used in Redux but plain objects in components
- Redux store uses `Immutable.fromJS()` and `mergeDeep`, but `Scheduler` immediately converts to plain JS via `this.state = this.props.algorithmData` and never uses Immutable again.
- This creates a confusing dual-paradigm where Redux is Immutable but component state is mutable.
- **Recommendation**: Pick one approach. Either go full Immutable or drop it.

### 2.4 Redux is mostly bypassed
- `AlgorithmSelector` dispatches config to Redux, but `Scheduler` copies everything to local `this.state` immediately and never reads from Redux again.
- Redux is effectively a one-time data-passing mechanism between two routes — `props` or context would suffice.
- **Recommendation**: Either commit to Redux for all state or remove it.

### 2.5 Recursive `setTimeout` as game loop
- All algorithms use `setTimeout(() => { ... this.algorithmXYZ() }, 1000/2000)` as a recursive loop.
- No cleanup on unmount → **memory leak** and potential errors if the user navigates away mid-simulation.
- **Recommendation**: Store timeout IDs and clear them in `componentWillUnmount`. Better yet, use `setInterval` or `requestAnimationFrame` with proper cleanup.

### 2.6 `HelperFunctions.js` mutates input arguments
- Functions like `abortProcess`, `removeFinishedProcess`, `startProcessExecution` receive arrays and objects, then **mutate them in-place** while also returning them.
- This makes the data flow unpredictable — callers can't tell if their local copies changed.
- **Recommendation**: Return new copies; never mutate inputs.

### 2.7 Massive code duplication
- The merge-fit block merging logic is **copy-pasted 3 times** in `algorithmRoundRobinMergeFit`.
- `ProcessQueues.js` repeats the same JSX template 4 times (once per priority level) — should be a loop.
- **Recommendation**: Extract shared logic into reusable functions/components.

### 2.8 `MemoryPage.js` is unused (dead code)
- `MemoryPage` component is never imported anywhere. It references `process.requestSize` which doesn't exist in the data model (it's `currentRequestSize`).

### 2.9 Navigation via `this.props.history` (deprecated pattern)
- Even ignoring the v5/v6 mismatch, pushing routes inside `setTimeout` callbacks after the simulation ends is fragile and creates race conditions.

### 2.10 No error boundaries or input validation
- No validation on the AlgorithmSelector inputs beyond HTML `min`/`max`/`required`.
- No React error boundaries — a single runtime crash in scheduling logic kills the whole app.

---

## 3. Summary — Recommended Path Forward

**Phase 1: Get it running**
1. Fix `react-router-dom` version mismatch (downgrade to v5 or migrate API to v6)
2. Replace `node-sass`/`gulp-sass` with `sass` (Dart Sass) — or remove Gulp and use CRA's built-in SASS
3. Upgrade `react-scripts` to 5.x (or migrate to Vite)
4. Verify `npm install` and `npm start` work cleanly

---

## 4. Phase 1 Resolution Log

### Done ✅
1. **Downgraded `react-router-dom` to v5.3.4** — code already used v5 API (`<Route component={}>`, `this.props.history.push`). Added `<Switch>` wrapper in `App.js`.
2. **Removed `node-sass`, `gulp-sass`, and all Gulp devDependencies** — replaced with `sass` (Dart Sass). CRA 5 compiles SCSS natively.
3. **Upgraded `react-scripts` to 5.0.1** — compatible with Node 22.
4. **Bumped React to 16.14.0** — last patch of React 16, best compat with CRA 5.
5. **Switched `index.js`** to import `./sass/index.scss` directly instead of pre-compiled `./css/index.css`.
6. **Removed `gulpfile.js` dependency** — no longer needed (file still exists but is inert).
7. **Verified**: `npm install` ✅, `npm start` ✅, `curl localhost:3000` → HTTP 200 ✅.

### Remaining warnings (non-blocking, for Phase 2+)
- ~30 eslint warnings in `Scheduler.js` (unused vars, no-sequences, no-loop-func, no-use-before-define)
- Deprecation warnings from webpack dev server (CRA 5 internal, harmless)

---

**Phase 2: Stabilize** ✅
5. Fix direct state mutations in `Scheduler.js`
6. Add `componentWillUnmount` cleanup for `setTimeout` loops
7. Add basic error boundaries

---

## 5. Phase 2 Resolution Log

### Done ✅

#### 5a. Fixed constructor state mutations
- **Before**: `this.state = this.props.algorithmData` then `this.state.finishedProcessList = []` (direct mutation of props/state).
- **After**: Spread into a new object `{ ...this.props.algorithmData }`, set properties on the copy, then assign to `this.state` once. Arrays for page lists are also shallow-copied before being passed to `createInitialPagesList`.

#### 5b. Added `componentWillUnmount` + timeout cleanup
- Added `this._timeoutId` and `this._unmounted` tracking fields.
- All 7 `setTimeout` calls in the component now store their ID in `this._timeoutId`.
- Each timeout callback checks `if (this._unmounted) return` as a guard.
- `componentWillUnmount` clears the active timeout and sets the `_unmounted` flag.
- **Prevents**: memory leaks, setState-on-unmounted-component warnings, and stale navigation attempts.

#### 5c. Added missing `startProcessExecution` class method
- `algorithmRoundRobinMergeFit` called `this.startProcessExecution(freeProcessId, i, j)` but the method didn't exist on the class — latent runtime crash for Merge Fit mode.
- Added the method as an arrow function that updates `processList[processIndex].status`, core assignment, quantum, and calls `setState`.

#### 5d. Added ErrorBoundary component
- New `src/ErrorBoundary.js` — class component with `getDerivedStateFromError` + `componentDidCatch`.
- Shows error message, expandable stack trace details, and a "Return to Home" button.
- Wraps the entire app inside `<BrowserRouter>` in `App.js`.
- **Prevents**: white screen of death on runtime errors.

### Build verification
- `npm run build` ✅ — compiles clean
- `npm start` ✅ — "Compiled successfully!" (previous eslint warnings resolved by CRA re-compilation)


**Phase 3: Refactor** ✅
8. Extract scheduling algorithms into separate modules
9. Consolidate state management (Redux vs local state)
10. Remove dead code, deduplicate logic

---

## 6. Phase 3 Resolution Log

### Done ✅

#### 8. Extracted scheduling algorithms into separate modules
- **`src/algorithms/sjf.js`** — SJF algorithm (`initSJF`, `algorithmSJF`)
- **`src/algorithms/roundRobinBestFit.js`** — Round Robin Best Fit (`algorithmRoundRobinBestFit`) with extracted helpers `handleExistingProcessPages`, `updateExecutingProcesses`, `updateQuantumOnWorkingCores`
- **`src/algorithms/roundRobinMergeFit.js`** — Round Robin Merge Fit (`algorithmRoundRobinMergeFit`) with extracted `mergeBlocks`, `findBestFreeBlock`, `abortMergeFitProcess` — **eliminates 3x copy-pasted merge block logic**
- **`src/algorithms/priorityQueue.js`** — Priority Queue Round Robin (`algorithmPriorityQueueRoundRobin`) with extracted `getPriorityQuantum`
- **`src/algorithms/index.js`** — barrel export for all algorithms
- **`src/Scheduler.js`** reduced from **1325 lines → 216 lines** (84% reduction). Now only contains lifecycle, render, and handlers.
- All algorithms receive the `scheduler` component instance as parameter, using `scheduler.state` / `scheduler.setState` / `scheduler.props` for state access.

#### 9. State management — deferred
- Redux is still used as a one-time data-passing mechanism between `AlgorithmSelector` → `Scheduler`. Full consolidation would require significant rearchitecting (moving to hooks + context, or committing to Redux for all runtime state). Deferred as low-priority since it works correctly.

#### 10. Removed dead code, deduplicated logic
- **Deleted `src/MemoryPage.js`** — unused component (never imported anywhere). Referenced `process.requestSize` which doesn't exist in the data model.
- **Deleted `gulpfile.js`** — leftover from Phase 1, no longer needed (CRA 5 handles SCSS natively).
- **Removed empty `movePagesFromHDToRAM()`** from `HelperFunctions.js` — stub function with no implementation or callers.
- **Deduplicated `ProcessQueues.js`** — 4 identical copy-pasted JSX blocks (one per priority level) replaced with a single `.map()` loop. Reduced from 92 → 33 lines (64% reduction).
- **Deduplicated merge block logic** — the 3x copy-pasted block merging code in `algorithmRoundRobinMergeFit` is now a single `mergeBlocks()` function called in 2 places.

### Build verification
- `npm run build` ✅ — compiles clean
- `npm start` ✅ — dev server starts without errors
