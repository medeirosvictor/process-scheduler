# CLAUDE.md

## Project Overview
Process Scheduler simulator — a React web app that simulates OS-level process scheduling algorithms (SJF, Round Robin, Priority Queue) with memory/disk page management.

**Live:** https://medeirosvictor.github.io/process-scheduler

## Tech Stack
- **React 16** (class components) with **React Context** for cross-route state
- **React Router DOM v5** for routing (`/` → algorithm selector, `/scheduler` → main view)
- **Vite** for bundling and dev server
- **SASS** (Dart Sass), source in `src/sass/`

## Project Structure
```
src/
├── App.jsx               # Root component, routes, AlgorithmProvider
├── index.jsx             # Entry point
├── AlgorithmContext.jsx   # React Context for algorithm config
├── AlgorithmSelector.jsx  # UI to pick algorithm, cores, processes
├── Scheduler.jsx          # Scheduling orchestrator & UI (delegates to algorithms/)
├── algorithms/            # Extracted scheduling algorithm modules
│   ├── index.js           # Barrel export
│   ├── sjf.js             # Shortest Job First
│   ├── roundRobinBestFit.js   # Round Robin + Best Fit memory
│   ├── roundRobinMergeFit.js  # Round Robin + Merge Fit memory
│   └── priorityQueue.js       # Priority Queue + Round Robin
├── HelperFunctions.js     # Shared scheduling/memory logic (sorting, page swaps, etc.)
├── Process.jsx            # Process display component
├── ProcessQueues.jsx      # Priority queue display component
├── Core.jsx               # Core display component
├── Memory.jsx             # Memory display
├── Disk.jsx               # Disk display
├── Page.jsx               # Page component
├── MemoryPageList.jsx     # Memory page list component
├── FinishedProcessList.jsx
├── AbortedProcessList.jsx
├── ErrorBoundary.jsx      # Error boundary (catches runtime crashes)
├── sass/index.scss        # SASS source
index.html                 # Entry HTML (project root, Vite convention)
public/                    # Static assets (favicon, manifest)
vite.config.js             # Vite configuration
```

## Commands
- `npm install` — install dependencies
- `npm start` — run dev server (Vite, port 3000)
- `npm run build` — production build (output: `build/`)
- `npm run deploy` — build + deploy to GitHub Pages

## Key Concepts
- **Scheduling algorithms**: SJF (shortest job first), Round Robin (with quantum), Priority Queue
- **Processes**: ID, execution time (4–25s), status (Ready/Waiting/Executing), priority (0–3), size (32–1024 bytes)
- **Cores**: up to 64, each with name, status, current process, quantum
- **Memory management**: simulated RAM pages + disk (HD) pages, page swapping (Best Fit / Merge Fit)
- **Limits**: max 64 cores, max 200 processes

## State Shape (React Context)
`AlgorithmContext` manages `algorithmData` containing: algorithm type, core list, process list, quantum, memory blocks, page lists, disk/memory sizes, and occupied percentages. Used as a one-time hand-off from AlgorithmSelector → Scheduler (Scheduler copies to local state on mount).

## Feedback
- `feedback/agent-user-feedback.md` — Remaining architectural notes and improvement ideas.

## Notes
- AlgorithmSelector writes config to Context; Scheduler reads it once and runs independently with local state
- Scheduling algorithms extracted into `src/algorithms/` modules
- Shared memory/process helpers in `HelperFunctions.js`
- Uses Vite for bundling and React 16 class components
- Deployed to GitHub Pages via `gh-pages` branch
