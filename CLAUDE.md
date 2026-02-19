# CLAUDE.md

## Project Overview
Process Scheduler simulator — a React web app that simulates OS-level process scheduling algorithms (SJF, Round Robin, Priority Queue) with memory/disk page management.

## Tech Stack
- **React 16** (class components) with **React Context** for cross-route state
- **React Router DOM v5** for routing (`/` → algorithm selector, `/scheduler` → main view)
- **SASS** compiled natively by CRA 5 (Dart Sass), source in `src/sass/`
- **jQuery** (dependency, likely minimal use)

## Project Structure
```
src/
├── App.js              # Root component, routes, AlgorithmProvider
├── index.js            # Entry point
├── AlgorithmContext.js # React Context for algorithm config (replaces Redux)
├── AlgorithmSelector.js # UI to pick algorithm, cores, processes
├── Scheduler.js        # Scheduling orchestrator & UI (delegates to algorithms/)
├── HelperFunctions.js  # Core scheduling/memory logic (sorting, page swaps, etc.)
├── Process.js          # Process component
├── ProcessQueues.js    # Queue display component
├── Core.js             # Core component
├── Memory.js           # Memory display
├── Disk.js             # Disk display
├── Page.js             # Page model/component
├── MemoryPage.js       # Memory page component
├── MemoryPageList.js   # Memory page list component
├── algorithms/         # Extracted scheduling algorithm modules
│   ├── index.js        # Barrel export
│   ├── sjf.js          # Shortest Job First
│   ├── roundRobinBestFit.js  # Round Robin + Best Fit memory
│   ├── roundRobinMergeFit.js # Round Robin + Merge Fit memory
│   └── priorityQueue.js      # Priority Queue + Round Robin
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

## State Shape (React Context)
`AlgorithmContext` manages `algorithmData` containing: algorithm type, core list, process list, quantum, memory blocks, page lists, disk/memory sizes, and occupied percentages. Used as a one-time hand-off from AlgorithmSelector → Scheduler (Scheduler copies to local state on mount).

## Feedback
- `feedback/agent-user-feedback.md` — Agent's critical review of the application, including architectural issues and build failure analysis. Updated as work progresses.

## Notes
- AlgorithmSelector writes config to Context; Scheduler reads it once and runs independently with local state
- Scheduling algorithms extracted into `src/algorithms/` modules
- Shared memory/process helpers in `HelperFunctions.js`
- Uses CRA 5 (react-scripts 5.0.1) and React 16 class components
- **App is building and running** — see feedback file for full history (Phases 1-3 + Context migration)
