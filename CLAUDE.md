# CLAUDE.md

## Project Overview
Process Scheduler simulator — a React web app that simulates OS-level process scheduling algorithms (SJF, Round Robin, Priority Queue) with memory/disk page management.

## Tech Stack
- **React 16** (class components) with **Redux** (redux-actions, redux-thunk, reselect)
- **Immutable.js** for state management
- **React Router DOM** for routing (`/` → algorithm selector, `/scheduler` → main view)
- **SASS** compiled natively by CRA 5 (Dart Sass), source in `src/sass/`
- **jQuery** (dependency, likely minimal use)

## Project Structure
```
src/
├── App.js              # Root component, routes, Redux Provider
├── index.js            # Entry point
├── Store.js            # Redux store with Immutable + thunk + devtools
├── Reducer.js          # Single reducer (handleActions), Immutable state
├── Actions.js          # Redux actions (receiveAlgorithmData, resetAlgorithmData)
├── Selector.js         # Reselect selectors
├── AlgorithmSelector.js # UI to pick algorithm, cores, processes
├── Scheduler.js        # Main scheduling logic & UI
├── HelperFunctions.js  # Core scheduling/memory logic (sorting, page swaps, etc.)
├── Process.js          # Process component
├── ProcessQueues.js    # Queue display component
├── Core.js             # Core component
├── Memory.js           # Memory display
├── Disk.js             # Disk display
├── Page.js             # Page model/component
├── MemoryPage.js       # Memory page component
├── MemoryPageList.js   # Memory page list component
├── FinishedProcessList.js
├── AbortedProcessList.js
├── ErrorBoundary.js    # Error boundary (catches runtime crashes)
├── sass/index.scss     # SASS source
├── css/index.css       # Legacy compiled CSS (unused, superseded by SCSS import)
└── serviceWorker.js    # CRA service worker
public/                 # Static assets (index.html, manifest, favicon)
gulpfile.js             # Gulp task for SASS compilation
```

## Commands
- `npm install` — install dependencies
- `npm start` — run dev server (react-scripts 5, port 3000)
- `npm run build` — production build
- `npm test` — run tests (react-scripts test)

## Key Concepts
- **Scheduling algorithms**: SJF (shortest job first), Round Robin (with quantum), Priority Queue
- **Processes**: ID, execution time (4–20s), status (Ready/Waiting/Executing), priority (0–3), size (32–1024 bytes)
- **Cores**: up to 64, each with name, status, current process, quantum
- **Memory management**: simulated RAM pages + disk (HD) pages, page swapping
- **Limits**: max 64 cores, max 200 processes

## State Shape (Redux / Immutable.js)
The single reducer manages `algorithmData` containing: algorithm type, core list, process list, quantum, memory blocks, page lists, disk/memory sizes, and occupied percentages.

## Feedback
- `feedback/agent-user-feedback.md` — Agent's critical review of the application, including architectural issues and build failure analysis. Updated as work progresses.

## Notes
- All state mutations go through Redux actions + Immutable.js `mergeDeep`
- Heavy scheduling/memory logic lives in `HelperFunctions.js`
- Uses older CRA (react-scripts 2.1.5) and React 16 patterns (class components)
- **App is now building and running** after Phase 1 fixes (see feedback file for history)
