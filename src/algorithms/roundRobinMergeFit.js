import {
    getAvailableCoreAmmount,
    randomIntFromInterval,
} from '../HelperFunctions'

/**
 * Merge adjacent free blocks in the memory blocks list.
 * Also absorbs trailing free blocks back into initialMemoryAvailability.
 *
 * @returns {Object} { memoryBlocksList, initialMemoryAvailability }
 */
function mergeBlocks(memoryBlocksList, initialMemoryAvailability) {
    if (!memoryBlocksList.length) return { memoryBlocksList, initialMemoryAvailability }

    for (let k = 0; k < memoryBlocksList.length; k++) {
        if (k === memoryBlocksList.length) break

        if (k === memoryBlocksList.length - 1) {
            if (memoryBlocksList[k].type === 'free' && initialMemoryAvailability > 0) {
                initialMemoryAvailability += memoryBlocksList[k].size
                memoryBlocksList = memoryBlocksList.filter(block => block.id !== memoryBlocksList[k].id)
                break
            }
        }
        if (memoryBlocksList[k].type === 'free') {
            if (memoryBlocksList[k + 1] && memoryBlocksList[k + 1].type === 'free') {
                memoryBlocksList[k].size += memoryBlocksList[k + 1].size
                memoryBlocksList = memoryBlocksList.filter(block => {
                    if (block.id === memoryBlocksList[k].id) {
                        memoryBlocksList[k].reqsize = 0
                    }
                    return block.id !== memoryBlocksList[k + 1].id
                })
            }
            if (memoryBlocksList[k - 1] && memoryBlocksList[k - 1].type === 'free') {
                memoryBlocksList[k].size += memoryBlocksList[k - 1].size
                memoryBlocksList = memoryBlocksList.filter(block => {
                    if (block.id === memoryBlocksList[k].id) {
                        memoryBlocksList[k].reqsize = 0
                    }
                    return block.id !== memoryBlocksList[k - 1].id
                })
            }
        }
    }

    return { memoryBlocksList, initialMemoryAvailability }
}

/**
 * Find the best-fit free block for a given size.
 *
 * @returns {Object|undefined} The best matching block, or undefined.
 */
function findBestFreeBlock(freeMemoryBlocks, requiredSize) {
    let minSize = requiredSize + 1
    let minSizeBlock
    for (let k = 0; k < freeMemoryBlocks.length; k++) {
        if (requiredSize <= freeMemoryBlocks[k].size) {
            let aux = freeMemoryBlocks[k].size - requiredSize
            if (aux < minSize) {
                minSize = aux
                minSizeBlock = freeMemoryBlocks[k]
            }
        }
    }
    return minSizeBlock
}

/**
 * Abort a process in merge-fit mode: free its memory blocks and core.
 */
function abortMergeFitProcess(processId, processList, coreList, busyMemoryBlocks, freeMemoryBlocks, memoryBlocksList, abortedProcessList, quantum) {
    let newFreeMemoryBlocks = []
    let cleanBusyMemoryBlocks = busyMemoryBlocks.filter(block => {
        if (block.pid === processId) {
            newFreeMemoryBlocks.push({ id: block.id, pid: null, reqsize: 0, size: block.size, type: 'free' })
        }
        return block.pid !== processId
    })

    for (let k = 0; k < coreList.length; k++) {
        let runningProcessId = coreList[k].processInExecution.substring(1)
        if (runningProcessId !== 'one') {
            let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
            if (currentProcess && currentProcess.id === processId) {
                coreList[k].processInExecution = 'none'
                coreList[k].status = 'waiting for process'
                coreList[k].currentQuantum = quantum
            }
        }
    }

    memoryBlocksList = memoryBlocksList.filter(block => {
        if (block.pid === processId) {
            block.pid = null
            block.type = 'free'
        }
        return block
    })

    let cleanProcessList = processList.filter(process => {
        if (process.id === processId) {
            process.status = 'aborted: out of memory'
            abortedProcessList = [...abortedProcessList, process]
        }
        return process.id !== processId
    })

    freeMemoryBlocks = [...freeMemoryBlocks, ...newFreeMemoryBlocks]
    busyMemoryBlocks = cleanBusyMemoryBlocks

    return { processList: cleanProcessList, coreList, busyMemoryBlocks, freeMemoryBlocks, memoryBlocksList, abortedProcessList }
}

/**
 * Round Robin with Merge Fit memory allocation.
 *
 * @param {Component} scheduler - The Scheduler component instance
 */
export function algorithmRoundRobinMergeFit(scheduler) {
    scheduler._timeoutId = setTimeout(() => {
        if (scheduler._unmounted) return

        let coreList = [...scheduler.state.coreList]
        let processList = [...scheduler.state.processList]
        let freeMemoryBlocks = [...scheduler.state.freeMemoryBlocks]
        let busyMemoryBlocks = [...scheduler.state.busyMemoryBlocks]
        let memoryBlocksList = [...scheduler.state.memoryBlocksList]
        let initialMemoryAvailability = scheduler.state.initialMemoryAvailability
        let finishedProcessList = scheduler.state.finishedProcessList
        let abortedProcessList = scheduler.state.abortedProcessList
        let quantum = scheduler.state.quantum

        let availableCores = getAvailableCoreAmmount(coreList)

        if (processList.length) {
            // Merge free blocks
            ;({ memoryBlocksList, initialMemoryAvailability } = mergeBlocks(memoryBlocksList, initialMemoryAvailability))
            scheduler.setState({ memoryBlocksList, initialMemoryAvailability })

            // Allocate processes to cores
            for (let i = 0; i < coreList.length; i++) {
                if (coreList[i].status === 'waiting for process' && availableCores > 0) {
                    for (let j = 0; j < processList.length; j++) {
                        if (processList[j].status === 'ready') {
                            let freeProcessId = processList[j].id

                            // Check if process already has a busy block
                            let busyBlock = busyMemoryBlocks.filter(block => block.pid === freeProcessId)

                            // Initial allocation: use free memory
                            if (initialMemoryAvailability > 0 && processList[j].bytes <= initialMemoryAvailability && busyBlock.length === 0) {
                                initialMemoryAvailability -= processList[j].bytes
                                busyMemoryBlocks = [...busyMemoryBlocks, { id: memoryBlocksList.length, size: processList[j].bytes, reqsize: processList[j].bytes, pid: freeProcessId, type: 'busy' }]
                                memoryBlocksList = [...memoryBlocksList, { id: memoryBlocksList.length, size: processList[j].bytes, reqsize: processList[j].bytes, pid: freeProcessId, type: 'busy' }]
                                scheduler.startProcessExecution(freeProcessId, i, j)
                                availableCores--
                                scheduler.setState({ busyMemoryBlocks, memoryBlocksList, initialMemoryAvailability })
                                break
                            }
                            // Already allocated blocks
                            else {
                                if (busyBlock.length) {
                                    availableCores--
                                    scheduler.startProcessExecution(freeProcessId, i, j)
                                    scheduler.setState({ coreList, processList, busyMemoryBlocks, memoryBlocksList, initialMemoryAvailability })
                                    break
                                }
                                if (freeMemoryBlocks.length) {
                                    let coreTracker = availableCores
                                    let minSizeBlock = findBestFreeBlock(freeMemoryBlocks, processList[j].bytes)

                                    if (minSizeBlock) {
                                        if (freeProcessId >= 0) {
                                            minSizeBlock.pid = freeProcessId
                                            minSizeBlock.type = 'busy'
                                            minSizeBlock.reqsize = processList[j].bytes
                                            busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]
                                            freeMemoryBlocks = freeMemoryBlocks.filter(block => block.id !== minSizeBlock.id)
                                            memoryBlocksList = memoryBlocksList.filter(block => {
                                                if (block.id === minSizeBlock.id) {
                                                    block.pid = freeProcessId
                                                    block.type = 'busy'
                                                    block.reqsize = processList[j].bytes
                                                }
                                                return block
                                            })
                                            processList[j].status = 'executing'
                                            coreList[i].processInExecution = 'P' + freeProcessId
                                            coreList[i].status = 'executing'
                                            coreList[i].quantum = quantum
                                            coreList[i].processInExecutionRemainingTime = processList[j].remainingExecutionTime
                                            availableCores--
                                            scheduler.setState({ coreList, processList, freeMemoryBlocks, busyMemoryBlocks, memoryBlocksList })
                                        } else {
                                            coreList[i].processInExecution = 'none'
                                            coreList[i].status = 'waiting for process'
                                            coreList[i].quantum = quantum
                                            coreList[i].processInExecutionRemainingTime = -1
                                            availableCores++
                                        }
                                        break
                                    }
                                    if (coreTracker === availableCores) {
                                        // Abort: no suitable block found
                                        processList = processList.filter(process => process.id !== freeProcessId)
                                        let abortedProcess = processList.filter(process => process.id === freeProcessId)
                                        if (abortedProcess[0]) {
                                            abortedProcess[0].status = 'aborted: out of memory'
                                            abortedProcessList = [...abortedProcessList, abortedProcess[0]]
                                        }
                                        scheduler.setState({ processList })
                                        j = -1
                                    }
                                } else {
                                    // No free blocks at all: abort
                                    let abortedProcess = processList.filter(process => process.id === freeProcessId)
                                    abortedProcess[0].status = 'aborted: out of memory'
                                    processList = processList.filter(process => process.id !== freeProcessId)
                                    abortedProcessList = [...abortedProcessList, abortedProcess[0]]
                                    scheduler.setState({ processList, coreList })
                                    j = -1
                                }
                            }
                        }
                    }
                }
            }
            scheduler.setState({ coreList, processList, abortedProcessList })

            // Remove finished processes (remaining time === 0)
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                if (runningProcessId !== 'one') {
                    let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
                    if (currentProcess.remainingExecutionTime === 0) {
                        coreList[i].processInExecution = 'none'
                        coreList[i].status = 'waiting for process'
                        coreList[i].currentQuantum = quantum
                        coreList[i].processInExecutionRemainingTime = -1
                        availableCores++
                        let currentBusyMemoryBlock = busyMemoryBlocks.find(block => block.pid === currentProcess.id)
                        freeMemoryBlocks = [...freeMemoryBlocks, { id: freeMemoryBlocks.length, size: currentBusyMemoryBlock.size, reqsize: 0, pid: null, type: 'free' }]
                        busyMemoryBlocks = busyMemoryBlocks.filter(block => block.pid !== currentProcess.id)
                        memoryBlocksList = memoryBlocksList.filter(block => {
                            if (block.pid === currentProcess.id) {
                                block.pid = null
                                block.type = 'free'
                                block.reqsize = currentBusyMemoryBlock.size
                            }
                            return block
                        })
                    }
                }
            }
            scheduler.setState({ freeMemoryBlocks, busyMemoryBlocks, memoryBlocksList })

            // Collect finished processes
            let currentFinishedProcesses = processList.filter(process => process.remainingExecutionTime === 0)
            currentFinishedProcesses = currentFinishedProcesses.map(process => {
                process.status = 'finished'
                return process
            })
            Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)
            processList = processList.filter(process => process.remainingExecutionTime > 0)

            // Remove quantum-expired processes
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                let notFinishedProcess = processList.find(process => process.id.toString() === runningProcessId)
                if (coreList[i].currentQuantum === 0 && notFinishedProcess.remainingExecutionTime > 0) {
                    coreList[i].processInExecution = 'none'
                    coreList[i].status = 'waiting for process'
                    coreList[i].currentQuantum = quantum
                    availableCores++
                    processList = processList.filter(process => process.id.toString() !== runningProcessId)
                    notFinishedProcess.status = 'ready'
                    processList = [...processList, notFinishedProcess]
                }
            }
            scheduler.setState({ coreList, processList, finishedProcessList })

            // Update executing processes (tick down + random requests)
            for (let i = 0; i < processList.length; i++) {
                if (processList[i].status === 'executing') {
                    processList[i].remainingExecutionTime--

                    let requestRdm = randomIntFromInterval(1, 4)
                    if (requestRdm === 1 || requestRdm === 2) {
                        let request = { pid: processList[i].id, size: randomIntFromInterval(32, 512) }

                        if (initialMemoryAvailability > 0 && request.size <= initialMemoryAvailability) {
                            initialMemoryAvailability -= request.size
                            busyMemoryBlocks = [...busyMemoryBlocks, { id: memoryBlocksList.length, size: request.size, reqsize: request.size, pid: processList[i].id, type: 'busy' }]
                            memoryBlocksList = [...memoryBlocksList, { id: memoryBlocksList.length, size: request.size, reqsize: request.size, pid: processList[i].id, type: 'busy' }]
                            scheduler.setState({ busyMemoryBlocks, memoryBlocksList, initialMemoryAvailability })
                        } else if (freeMemoryBlocks.length) {
                            let minSizeBlock = findBestFreeBlock(freeMemoryBlocks, request.size)
                            if (minSizeBlock) {
                                if (processList[i].id >= 0) {
                                    minSizeBlock.pid = processList[i].id
                                    minSizeBlock.type = 'busy'
                                    minSizeBlock.reqsize = processList[i].bytes
                                    busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]
                                    freeMemoryBlocks = freeMemoryBlocks.filter(block => block.id !== minSizeBlock.id)
                                    memoryBlocksList = memoryBlocksList.filter(block => {
                                        if (block.id === minSizeBlock.id) {
                                            block.pid = minSizeBlock.id
                                            block.type = 'busy'
                                            block.reqsize = minSizeBlock.bytes
                                        }
                                        return block
                                    })
                                    scheduler.setState({ freeMemoryBlocks, busyMemoryBlocks, memoryBlocksList })
                                }
                            }
                        } else {
                            // Abort process
                            let result = abortMergeFitProcess(processList[i].id, processList, coreList, busyMemoryBlocks, freeMemoryBlocks, memoryBlocksList, abortedProcessList, quantum)
                            processList = result.processList
                            coreList = result.coreList
                            busyMemoryBlocks = result.busyMemoryBlocks
                            freeMemoryBlocks = result.freeMemoryBlocks
                            memoryBlocksList = result.memoryBlocksList
                            abortedProcessList = result.abortedProcessList
                        }
                    }
                }
            }

            scheduler.setState({ coreList, processList, memoryBlocksList, freeMemoryBlocks, busyMemoryBlocks, abortedProcessList })

            // Update quantum on working cores
            for (let i = 0; i < coreList.length; i++) {
                if (coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
                    coreList[i].currentQuantum--
                    coreList[i].processInExecutionRemainingTime--
                }
            }

            // Post-tick merge
            ;({ memoryBlocksList, initialMemoryAvailability } = mergeBlocks(memoryBlocksList, initialMemoryAvailability))
            scheduler.setState({ coreList, processList, memoryBlocksList })

            algorithmRoundRobinMergeFit(scheduler)
        } else {
            // Final merge after all processes done
            ;({ memoryBlocksList, initialMemoryAvailability } = mergeBlocks(memoryBlocksList, initialMemoryAvailability))
            scheduler.setState({ initialMemoryAvailability, memoryBlocksList })

            scheduler._timeoutId = setTimeout(() => {
                if (scheduler._unmounted) return
                scheduler.props.history.push('/')
            }, 10000)
        }
    }, 2000)
}
