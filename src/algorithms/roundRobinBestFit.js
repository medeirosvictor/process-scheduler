import {
    arePagesOnMemory,
    swapFromHDToRAM,
    getFreeMemoryAVailability,
    abortProcess,
    removeFinishedProcess,
    swapFromRAMToHD,
    addBlockToMemoryPage,
    startProcessExecution,
    getBestAvailableBlock,
    hasEnoughSpaceByMovingPagesToHD,
    getRemovablePagesFromRAM,
    getFreeBlocksOnMemory,
    getProcessesIdsInExecution,
    getProcessPagesReferences,
    getAvailableCoreAmmount,
    randomIntFromInterval,
} from '../HelperFunctions'

/**
 * Round Robin with Best Fit memory allocation.
 *
 * @param {Component} scheduler - The Scheduler component instance
 */
export function algorithmRoundRobinBestFit(scheduler) {
    scheduler._timeoutId = setTimeout(() => {
        if (scheduler._unmounted) return

        let {
            coreList, processList,
            finishedProcessList, abortedProcessList, diskPageList,
            memoryPageList, pageSize, memorySize, quantum
        } = scheduler.state

        let initialMemoryAvailability = getFreeMemoryAVailability(memoryPageList, memorySize)
        let availableCores = getAvailableCoreAmmount(coreList)

        if (processList.length) {
            // Allocate processes to cores
            for (let i = 0; i < coreList.length; i++) {
                if (coreList[i].status === 'waiting for process' && availableCores > 0) {
                    for (let j = 0; j < getLength(scheduler.state.processList); j++) {
                        if (processList[j].status === 'ready') {
                            let currentProcess = processList[j]
                            diskPageList = scheduler.state.diskPageList
                            memoryPageList = scheduler.state.memoryPageList
                            processList = scheduler.state.processList
                            abortedProcessList = scheduler.state.abortedProcessList
                            initialMemoryAvailability = getFreeMemoryAVailability(memoryPageList, memorySize)
                            let processesIdsInExecution = getProcessesIdsInExecution(processList)
                            processesIdsInExecution.push(currentProcess.id)
                            let removablePagesIdsFromRAM = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)
                            let processPagesReferences = getProcessPagesReferences(memoryPageList, diskPageList, currentProcess)
                            let enoughSpaceByMovingPagesToHD = hasEnoughSpaceByMovingPagesToHD(removablePagesIdsFromRAM, memoryPageList, initialMemoryAvailability, currentProcess.bytes)
                            let freeBlocksOnMemory = getFreeBlocksOnMemory(memoryPageList)

                            // Initial start case: no blocks free yet
                            if (currentProcess.bytes <= initialMemoryAvailability && processPagesReferences.length === 0) {
                                ;[coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                scheduler.setState({ coreList, processList })

                                ;[memoryPageList, diskPageList, initialMemoryAvailability] = addBlockToMemoryPage(currentProcess, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                                scheduler.setState({ memoryPageList, diskPageList, initialMemoryAvailability })

                                availableCores--
                                break
                            }

                            // Process already allocated: move pages back from HD to RAM
                            else if (processPagesReferences.length) {
                                let result = handleExistingProcessPages(
                                    currentProcess, processPagesReferences, processesIdsInExecution,
                                    memoryPageList, diskPageList, initialMemoryAvailability,
                                    coreList, processList, abortedProcessList, quantum, i, j
                                )
                                ;({ coreList, processList, memoryPageList, diskPageList, abortedProcessList, initialMemoryAvailability, availableCores } = result)
                                scheduler.setState({ coreList, processList, memoryPageList, diskPageList, abortedProcessList, initialMemoryAvailability })
                                break
                            }

                            // Can we move pages to HD to make space?
                            else if (enoughSpaceByMovingPagesToHD) {
                                ;[memoryPageList, diskPageList, initialMemoryAvailability] = swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability)
                                scheduler.setState({ diskPageList, memoryPageList, initialMemoryAvailability })

                                ;[coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                scheduler.setState({ coreList, processList })
                                availableCores--

                                ;[memoryPageList, diskPageList, initialMemoryAvailability] = addBlockToMemoryPage(currentProcess, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                                scheduler.setState({ memoryPageList, diskPageList, initialMemoryAvailability })
                                break
                            }

                            // Try free blocks
                            else if (freeBlocksOnMemory.length) {
                                let bestBlock = getBestAvailableBlock(freeBlocksOnMemory, currentProcess)
                                if (bestBlock) {
                                    memoryPageList = memoryPageList.map(function (page) {
                                        if (page.id === bestBlock.memoryPageId) {
                                            page.blockList[bestBlock.blockIndex].currentRequestSize = currentProcess.bytes
                                            page.blockList[bestBlock.blockIndex].processId = currentProcess.id
                                            page.blockList[bestBlock.blockIndex].type = 'busy'
                                        }
                                        return page
                                    })
                                    scheduler.setState({ memoryPageList })
                                    ;[coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                    scheduler.setState({ coreList, processList })
                                } else {
                                    ;[coreList, processList, memoryPageList, diskPageList, abortedProcessList] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                    scheduler.setState({ coreList, processList, memoryPageList, diskPageList, abortedProcessList })
                                    j = -1
                                }
                                break
                            }

                            // Nothing else to do: abort
                            else {
                                ;[coreList, processList, memoryPageList, diskPageList, abortedProcessList] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                scheduler.setState({ coreList, processList, memoryPageList, diskPageList, abortedProcessList })
                                j = -1
                            }
                        }
                    }
                }
            }
            scheduler.setState({ coreList, abortedProcessList, memoryPageList, diskPageList })

            // Remove finished processes
            let removedFinishedProcess = removeFinishedProcess(coreList, processList, memoryPageList, finishedProcessList, quantum)
            if (removedFinishedProcess.length) {
                ;[coreList, processList, memoryPageList, finishedProcessList] = removedFinishedProcess
                scheduler.setState({ coreList, processList, memoryPageList, finishedProcessList })
            }

            // Remove processes whose quantum expired but still have remaining time
            for (let i = 0; i < getLength(coreList); i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                let notFinishedProcess = processList.find(process => process.id.toString() === runningProcessId)
                if (coreList[i].currentQuantum === 0 && notFinishedProcess.remainingExecutionTime > 0) {
                    coreList[i].processInExecution = 'none'
                    coreList[i].status = 'waiting for process'
                    coreList[i].currentQuantum = scheduler.state.quantum
                    availableCores++
                    processList = processList.filter(process => process.id.toString() !== runningProcessId)
                    notFinishedProcess.status = 'ready'
                    processList = [...processList, notFinishedProcess]
                }
            }
            scheduler.setState({ coreList, processList, finishedProcessList })

            // Update executing processes (tick down + random requests)
            updateExecutingProcesses(scheduler, processList, coreList, memoryPageList, diskPageList, abortedProcessList, memorySize, pageSize, quantum, initialMemoryAvailability)

            updateQuantumOnWorkingCores(coreList)
            scheduler.setState({ processList, memoryPageList, diskPageList, abortedProcessList })

            algorithmRoundRobinBestFit(scheduler)
        } else {
            scheduler._timeoutId = setTimeout(() => {
                if (scheduler._unmounted) return
                scheduler.props.history.push('/')
            }, 10000)
        }
    }, 2000)
}

// --- Helper functions specific to this algorithm ---

function getLength(list) {
    return list.length
}

function handleExistingProcessPages(
    currentProcess, processPagesReferences, processesIdsInExecution,
    memoryPageList, diskPageList, initialMemoryAvailability,
    coreList, processList, abortedProcessList, quantum, i, j
) {
    let availableCores = getAvailableCoreAmmount(coreList)
    let processPagesInHD = processPagesReferences.filter(ref => ref.pageLocation === 'disk')

    if (processPagesInHD.length) {
        let innerRemovablePages = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)
        let ammountOfBytesToBringFromHD = processPagesReferences.map(item => item.pageSize).reduce((prev, curr) => prev + curr, 0)
        let innerEnoughSpace = hasEnoughSpaceByMovingPagesToHD(innerRemovablePages, memoryPageList, initialMemoryAvailability, ammountOfBytesToBringFromHD)
        let processPagesInHDIds = processPagesInHD.map(item => item.pageReference)

        if (ammountOfBytesToBringFromHD <= initialMemoryAvailability) {
            ;[memoryPageList, diskPageList, initialMemoryAvailability] = swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability)
            availableCores--
            ;[coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
        } else if (innerEnoughSpace && innerRemovablePages.length >= processPagesInHD.length) {
            ;[memoryPageList, diskPageList, initialMemoryAvailability] = swapFromRAMToHD(memoryPageList, diskPageList, innerRemovablePages, initialMemoryAvailability)
            ;[memoryPageList, diskPageList, initialMemoryAvailability] = swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability)
            availableCores--
            ;[coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
        } else {
            ;[coreList, processList, memoryPageList, diskPageList, abortedProcessList] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
        }
    } else {
        ;[coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
    }

    return { coreList, processList, memoryPageList, diskPageList, abortedProcessList, initialMemoryAvailability, availableCores }
}

function updateExecutingProcesses(scheduler, processList, coreList, memoryPageList, diskPageList, abortedProcessList, memorySize, pageSize, quantum, initialMemoryAvailability) {
    for (let i = 0; i < getLength(scheduler.state.processList); i++) {
        diskPageList = scheduler.state.diskPageList
        memoryPageList = scheduler.state.memoryPageList
        processList = scheduler.state.processList
        abortedProcessList = scheduler.state.abortedProcessList
        initialMemoryAvailability = getFreeMemoryAVailability(memoryPageList, memorySize)

        if (processList[i].status === 'executing') {
            let currentProcess = processList[i]
            let freeBlocksPagesReferences = getFreeBlocksOnMemory(memoryPageList)
            let processesIdsInExecution = getProcessesIdsInExecution(processList)
            let removablePagesIdsFromRAM = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)
            let pagesOnMemory = arePagesOnMemory(processList[i], diskPageList)

            if (!pagesOnMemory) {
                let processPagesReferences = getProcessPagesReferences(memoryPageList, diskPageList, currentProcess)
                let processPagesInHD = processPagesReferences.filter(ref => ref.pageLocation === 'disk')
                if (processPagesInHD.length) {
                    let processPagesInHDIds = processPagesInHD.map(item => item.pageReference)
                    ;[memoryPageList, diskPageList, initialMemoryAvailability] = swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability)
                    scheduler.setState({ memoryPageList, diskPageList, initialMemoryAvailability })
                }
            }

            processList[i].remainingExecutionTime--

            // Random memory requests
            let requestRdm = randomIntFromInterval(1, 6)
            if (requestRdm === 1) {
                let request = { id: processList[i].id, bytes: randomIntFromInterval(32, 512) }
                let enoughSpaceByMovingPagesToHD = hasEnoughSpaceByMovingPagesToHD(removablePagesIdsFromRAM, memoryPageList, initialMemoryAvailability, request)

                if (initialMemoryAvailability > 0 && request.bytes <= initialMemoryAvailability) {
                    ;[memoryPageList, diskPageList, initialMemoryAvailability] = addBlockToMemoryPage(request, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                    scheduler.setState({ memoryPageList, diskPageList, initialMemoryAvailability })
                } else if (enoughSpaceByMovingPagesToHD) {
                    ;[memoryPageList, diskPageList, initialMemoryAvailability] = swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability)
                    scheduler.setState({ memoryPageList, diskPageList, initialMemoryAvailability })
                    ;[memoryPageList, diskPageList, initialMemoryAvailability] = addBlockToMemoryPage(request, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                    scheduler.setState({ memoryPageList, diskPageList, initialMemoryAvailability })
                } else if (freeBlocksPagesReferences.length) {
                    let bestBlock = getBestAvailableBlock(freeBlocksPagesReferences, request)
                    if (bestBlock) {
                        memoryPageList = memoryPageList.map(function (page) {
                            if (page.id === bestBlock.memoryPageId) {
                                page.blockList[bestBlock.blockIndex].currentRequestSize = request.bytes
                                page.blockList[bestBlock.blockIndex].processId = request.id
                            }
                            return page
                        })
                        scheduler.setState({ memoryPageList })
                    } else {
                        ;[coreList, processList, memoryPageList, diskPageList, abortedProcessList] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                        scheduler.setState({ coreList, processList, memoryPageList, diskPageList, abortedProcessList })
                    }
                    break
                } else {
                    ;[coreList, processList, memoryPageList, diskPageList, abortedProcessList] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                    scheduler.setState({ coreList, processList, memoryPageList, diskPageList, abortedProcessList })
                }
            }
        }
    }
}

function updateQuantumOnWorkingCores(coreList) {
    for (let i = 0; i < coreList.length; i++) {
        if (coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
            coreList[i].currentQuantum--
            coreList[i].processInExecutionRemainingTime--
        }
    }
}
