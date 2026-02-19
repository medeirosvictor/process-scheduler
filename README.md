# Process Scheduler Simulator

A web-based simulator that visualizes how operating systems manage processes across CPU cores. It demonstrates core OS concepts — scheduling algorithms, memory allocation, and page swapping — in real time through an interactive UI.

## What is a Process Scheduler?

In an operating system, dozens or hundreds of processes compete for limited CPU time. The **process scheduler** decides which process runs next, for how long, and on which core. Different algorithms make different trade-offs between fairness, throughput, and response time. This simulator lets you watch those trade-offs play out visually.

## Scheduling Algorithms

### Shortest Job First (SJF)
Picks the process with the shortest total execution time and runs it to completion. This is **non-preemptive** — once a process starts, it won't be interrupted. SJF minimizes average wait time but can starve long-running processes if short ones keep arriving.

### Round Robin
Each process gets a fixed time slice called a **quantum**. When the quantum expires, the process goes back to the ready queue and the next one takes its turn. This guarantees fairness — no process waits forever — at the cost of context-switching overhead. The Round Robin mode also includes memory management simulation (see below).

### Priority Queue with Round Robin
Processes are grouped into 4 priority levels (0 = highest, 3 = lowest). Higher-priority processes get longer quantum slices (priority 0 gets 4× the base quantum, priority 3 gets 1×). Within each level, processes are scheduled round-robin. This balances urgency with fairness.

## Memory Management (Round Robin only)

When running Round Robin, the simulator also models virtual memory with two allocation strategies:

### Best Fit
Scans all free memory blocks and picks the smallest one that fits the process. Minimizes wasted space but can be slower to allocate. Includes **page swapping** — when RAM is over 80% full, idle pages are moved to disk (HD) to make room.

### Merge Fit
Allocates memory blocks and, when processes finish, **merges adjacent free blocks** back into larger contiguous regions. This fights external fragmentation — the problem where free memory exists but is scattered in pieces too small to use.

## Simulation Model

### Processes
Each process has a random execution time (4–25 seconds), a priority level (0–3), and a memory footprint (32–1024 bytes). During execution, processes may randomly request additional memory, which the allocator must handle or abort the process.

| Property | Range | Description |
|---|---|---|
| Execution Time | 4–25s | Total CPU time needed |
| Priority | 0–3 | 0 = highest, 3 = lowest |
| Size | 32–1024 bytes | Memory footprint |
| Status | Ready / Executing / Finished / Aborted | Lifecycle state |

### CPU Cores
Up to **64 cores** run in parallel. Each core tracks its current process, remaining quantum, and execution time. When a process finishes or its quantum expires, the core picks up the next ready process.

### Memory & Disk
Simulated RAM is divided into **pages** of configurable size. When RAM fills up, pages belonging to idle processes are **swapped to disk** (simulated HD). When those processes need to run again, their pages are swapped back. This mirrors how real operating systems use virtual memory to run more processes than physical RAM can hold.

## Live Demo

**https://medeirosvictor.github.io/process-scheduler**

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm start

# Production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Configuration

On the home screen, select an algorithm and configure:

- **Algorithm** — SJF, Round Robin, or Priority Queue
- **Quantum** — time slice in seconds (Round Robin / Priority Queue only, 2–20)
- **Core count** — number of CPU cores (1–64)
- **Process count** — number of processes to simulate (1–200)
- **Memory size** — RAM in bytes (Round Robin only, min 1024)
- **Memory strategy** — Best Fit or Merge Fit (Round Robin only)

Click **Start Scheduler Simulation** to watch the scheduler run. You can add random processes mid-simulation with the "Add Random Process" button.

## Tech Stack

- **React 16** with class components
- **React Context** for configuration state
- **React Router v5** for navigation
- **Vite** for bundling and dev server
- **SASS** (Dart Sass)

## Project Structure

```
src/
├── AlgorithmContext.jsx    # React Context for config hand-off
├── AlgorithmSelector.jsx   # Configuration form UI
├── Scheduler.jsx           # Orchestrator — lifecycle, render, delegates to algorithms/
├── algorithms/             # Scheduling algorithm modules
│   ├── sjf.js              # Shortest Job First
│   ├── roundRobinBestFit.js    # Round Robin + Best Fit memory
│   ├── roundRobinMergeFit.js   # Round Robin + Merge Fit memory
│   └── priorityQueue.js        # Priority Queue + Round Robin
├── HelperFunctions.js      # Shared memory/process utilities
├── Core.jsx                # Core display component
├── Process.jsx             # Process display component
├── ProcessQueues.jsx       # Priority queue display component
├── Memory.jsx / Disk.jsx   # Memory and disk visualization
└── ErrorBoundary.jsx       # Catches runtime errors gracefully
```
