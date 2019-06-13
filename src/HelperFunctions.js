export function arePagesOnMemory(process, diskPageList) {
    for (let k = 0; k < diskPageList.length; k++) {
        for (let q = 0; q < diskPageList[k].blockList.length; q++) {
            if (diskPageList[k].blockList[q].processId === process.id) {
                return false
            }
        }
    }

    return true
}
export function getFreeMemoryAVailability(memoryPageList, memorySize) {
    let memoryAvailability = memorySize
    for (let i = 0; i < memoryPageList.length; i++) {
        memoryAvailability -= memoryPageList[i].currentPageSize
    }

    return memoryAvailability
}

export function abortProcess(process, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum) {
    let abortedProcess = processList.filter(function(p) {
        return p.id === process.id
    })

    for (let k = 0; k < coreList.length; k++) {
        if (coreList[k].processInExecution.substring(1) === process.id.toString()) {
            coreList[k].processInExecution = 'none'
            coreList[k].status = 'waiting for process'
            coreList[k].currentQuantum = quantum
        }
    }

    for(let k = 0; k < memoryPageList.length; k++) {
        for(let j = 0; j < memoryPageList[k].blockList.length; j++) {
            if(memoryPageList[k].blockList[j].processId === process.id) {
                memoryPageList[k].blockList[j].processId = null
                memoryPageList[k].blockList[j].currentRequestSize = 0
                memoryPageList[k].blockList[j].type = 'free'
            }
        }
    }

    for(let k = 0; k < diskPageList.length; k++) {
        for(let j = 0; j < diskPageList[k].blockList.length; j++) {
            if(diskPageList[k].blockList[j].processId === process.id) {
                diskPageList[k].blockList[j].processId = null
                diskPageList[k].blockList[j].currentRequestSize = 0
                diskPageList[k].blockList[j].type = 'free'
            }
        }
    }

    abortedProcess[0].status = 'aborted: out of memory'
    abortedProcessList = [...abortedProcessList, abortedProcess[0]]

    processList = processList.filter(function(p) {
        return p.id !== process.id
    })

    return [
        coreList,
        processList,
        memoryPageList,
        diskPageList,
        abortedProcessList
    ]
}
export function removeFinishedProcess(coreList, processList, memoryPageList, finishedProcessList, quantum) {
    //removing from the core
    let removed = false
    for (let i = 0; i < coreList.length; i++) {
        let runningProcessId = coreList[i].processInExecution.substring(1)
        if (runningProcessId !== 'none'.substring(1)) {
            let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
            if(currentProcess.remainingExecutionTime === 0) {
                removed = true;
                coreList[i].processInExecution = 'none'
                coreList[i].status = 'waiting for process'
                coreList[i].currentQuantum = quantum
                coreList[i].processInExecutionRemainingTime = -1

                 // clean memory pages because for it to be executing it must be all there
                 for(let k = 0; k < memoryPageList.length; k++) {
                    for(let j = 0; j < memoryPageList[k].blockList.length; j++) {
                        if(memoryPageList[k].blockList[j].processId === currentProcess.id) {
                            memoryPageList[k].currentPageSize = memoryPageList[k].currentPageSize - memoryPageList[k].blockList[j].size
                            memoryPageList[k].blockList[j].processId = null
                            memoryPageList[k].blockList[j].currentRequestSize = 0
                            memoryPageList[k].blockList[j].type = 'free'
                        }
                    }
                }
            }
        }
    }

    if (!removed) {
        return false
    }

    //removing from the process list
    // Remove finished Processes
    let finishedProcessListId = []
    let currentFinishedProcesses = processList.filter(function(process) {
        if (process.remainingExecutionTime === 0) {
            finishedProcessListId.push(process.id)
            process.status = 'finished'
        }
        return process.remainingExecutionTime === 0
    })

    if (finishedProcessListId.length) {
        for(let i = 0; i < memoryPageList.length; i++) {
            for(let j = 0; j < memoryPageList[i].blockList.length; j++) {
                if(finishedProcessListId.includes(memoryPageList[i].blockList[j].processId)) {
                    memoryPageList[i].currentPageSize = memoryPageList[i].currentPageSize - memoryPageList[i].blockList[j].currentRequestSize
                    memoryPageList[i].blockList[j].processId = null
                    memoryPageList[i].blockList[j].currentRequestSize = 0
                    memoryPageList[i].blockList[j].type = 'free'
                }
            }
        }
    }

    finishedProcessList = [...finishedProcessList, ...currentFinishedProcesses]

    processList = processList.filter(function(process) {
        return process.remainingExecutionTime > 0
    })

    return [coreList, processList, memoryPageList, finishedProcessList]
}
export function startProcessExecution(currentProcess, coreList, processList, coreListRef, processListRef, quantum) {
    processList[processListRef].status = 'executing'
    coreList[coreListRef].processInExecution = 'P' + currentProcess.id
    coreList[coreListRef].status = 'executing'
    coreList[coreListRef].quantum = quantum
    coreList[coreListRef].processInExecutionRemainingTime = processList[processListRef].remainingExecutionTime
    return [coreList, processList]
}

export function createInitialPagesList(pageList, pageSize, pageContainerSize) {
    let numberOfPages = pageContainerSize / pageSize
    for (let i = 0; i < numberOfPages; i++) {
        pageList.push({
            id: i, 
            currentPageSize: 0, 
            blockList: []
        })
    }

    return pageList
}

export function addBlockToMemoryPage(process, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize) {
    initialMemoryAvailability -= process.bytes
    for (let i=0; i < memoryPageList.length; i++) {
        if (memoryPageList[i].currentPageSize < pageSize && memoryPageList[i].currentPageSize + process.bytes <= pageSize) {
            memoryPageList[i].blockList = [...memoryPageList[i].blockList, {processId: process.id, size: process.bytes, type: 'busy', currentRequestSize: process.bytes}]
            memoryPageList[i].currentPageSize = memoryPageList[i].currentPageSize + process.bytes
            break
        }
    }

    //check if now we have more than 80% of the memory occupied
    let processesIdsInExecution = getProcessesIdsInExecution(processList)
    let occupiedPercentage = getOccupiedPercentageInAllMemoryPages(memoryPageList, memorySize)
    let removablePagesIdsFromRAM = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)

    //see if we can move stuff to HD
    if (occupiedPercentage > 80 && removablePagesIdsFromRAM.length) {
        [ memoryPageList, diskPageList, initialMemoryAvailability] = swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability)
    }

    return [memoryPageList, diskPageList, initialMemoryAvailability]
}

export function swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability) {
    for (let k = 0; k < memoryPageList.length; k++) {
        if (removablePagesIdsFromRAM.includes(memoryPageList[k].id) && memoryPageList[k].currentPageSize >= 0) {
            for (let j = 0; j < diskPageList.length; j++) {
                if (diskPageList[j].currentPageSize === 0 || diskPageList[j].currentPageSize + memoryPageList[k].currentPageSize <= 1024) {
                    initialMemoryAvailability += memoryPageList[k].currentPageSize
                    diskPageList[j].blockList = [...diskPageList[j].blockList, ...memoryPageList[k].blockList]
                    diskPageList[j].currentPageSize += memoryPageList[k].currentPageSize
                    memoryPageList[k].blockList = []
                    memoryPageList[k].currentPageSize = 0
                    break
                }
            }
        }
    }

    return [memoryPageList, diskPageList, initialMemoryAvailability]
}

export function swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability) {
    for (let k = 0; k < diskPageList.length; k++) {
        if (processPagesInHDIds.includes(diskPageList[k].id)) {
            for (let j = 0; j < memoryPageList.length; j++) {
                if (memoryPageList[j].currentPageSize === 0 || memoryPageList[j].currentPageSize + diskPageList[k].currentPageSize <= 1024) {
                    initialMemoryAvailability -= diskPageList[k].currentPageSize
                    memoryPageList[j].blockList = [...memoryPageList[j].blockList, ...diskPageList[k].blockList]
                    memoryPageList[j].currentPageSize += diskPageList[k].currentPageSize
                    diskPageList[k].blockList = []
                    diskPageList[k].currentPageSize = 0
                    break
                }
            }                    
        }
    }

    return [memoryPageList, diskPageList, initialMemoryAvailability]
}

export function movePagesFromHDToRAM() {

}

export function getBestAvailableBlock(freeBlocksPagesReferences, request) {
    let bestBlock
    let smallestDiff = 1024
    for (let q = 0; q < freeBlocksPagesReferences.length; q++) {
        if (freeBlocksPagesReferences[q].blockSize >= request.bytes) {
            let aux = freeBlocksPagesReferences[q].blockSize - request.bytes
            if (aux < smallestDiff) {
                smallestDiff = aux
                bestBlock = freeBlocksPagesReferences[q]
            }
        }
    }

    return bestBlock
}

export function getNewPageId(memoryPageList, diskPageList) {
    let highestMemoryId = -1
    let highestDiskId = -1
    for (let i = 0; i < memoryPageList.length; i++) {
        let aux = memoryPageList[i].id
        if (aux > highestMemoryId) {
            highestMemoryId = aux
        }
    }
    for (let i = 0; i < diskPageList.length; i++) {
        let aux = diskPageList[i].id
        if (aux > highestDiskId) {
            highestDiskId = aux
        }
    }

    let res = highestMemoryId > highestDiskId ? highestMemoryId : highestDiskId
    return res
}

export function hasEnoughSpaceByMovingPagesToHD(removablePagesIdsFromRAM, memoryPageList, currentInitialMemory, processSize) {
    // From the Removable Pages from Memory
    // Which ones I have to remove to make space?
    let totalSum = 0
    let optimalPagesForRemoval = []
    for (let k = 0; k < removablePagesIdsFromRAM.length; k++) {
        let memoryPage = memoryPageList.filter((page) => page.id === removablePagesIdsFromRAM[k]) 
        totalSum = totalSum + memoryPage[0].currentPageSize
        optimalPagesForRemoval.push()
    }
    if (currentInitialMemory + totalSum >= processSize) {
        return true
    }
    return false
}

export function getOccupiedPercentageInAllDiskPages(diskPageList, diskSize) {
    let currentOccupiedBytesInAllDiskPages = getOccupiedBytesInAllDiskPages(diskPageList)
    let percentage = (currentOccupiedBytesInAllDiskPages * 100) /  diskSize
    percentage = Math.round( percentage * 10 ) / 10;

    return percentage
}

export function getOccupiedBytesInAllDiskPages(diskPageList) {
    let currentOccupiedBytesInAllDiskPages = 0
    for (let i = 0; i < diskPageList.length; i++) {
        currentOccupiedBytesInAllDiskPages += diskPageList[i].currentPageSize
    }

    return currentOccupiedBytesInAllDiskPages
}

export function getOccupiedPercentageInAllMemoryPages(memoryPageList, memorySize) {
    let currentOccupiedBytesInAllMemoryPages = getOccupiedBytesInAllMemoryPages(memoryPageList)
    let percentage = (currentOccupiedBytesInAllMemoryPages * 100) /  memorySize
    percentage = Math.round( percentage * 10 ) / 10;

    return percentage
}

export function getOccupiedBytesInAllMemoryPages(memoryPageList) {
    let currentOccupiedBytesInAllMemoryPages = 0
    for (let i = 0; i < memoryPageList.length; i++) {
        currentOccupiedBytesInAllMemoryPages += memoryPageList[i].currentPageSize
    }

    return currentOccupiedBytesInAllMemoryPages
}

export function getFreeBlocksOnMemory(memoryPageList) {
    let freeBlocksOnMemory = []
    for (let i = 0; i < memoryPageList.length; i++){
        memoryPageList[i].blockList.map(function (block, index) {
            if (block.type === 'free') {
                freeBlocksOnMemory.push({memoryPageId: memoryPageList[i].id, blockSize: block.size, blockIndex: index})
            }
            return block.type === 'free'
        })
    }

    return freeBlocksOnMemory
}

export function getRemovablePagesFromRAM(memoryPageList, processIdsInExecution) {
    let removablePagesIdsFromRAM = []
    for (let i = 0; i < memoryPageList.length; i++) {
        let memoryPageProcessIds = memoryPageList[i].blockList.map(process => process.processId)
        let found = memoryPageProcessIds.some(processId => processIdsInExecution.includes(processId))
        if(!found) {
            removablePagesIdsFromRAM.push(memoryPageList[i].id)
        }
    }

    return removablePagesIdsFromRAM
}

export function getProcessIdsInPage(page) {
    return page.blockList.map(process => process.processId)
}

export function getProcessesIdsInExecution(processList) {
    let processesIdsInExecution = []
    processList.map(function(process) {
        if(process.status === 'executing') {processesIdsInExecution.push(process.id)}
        return process
    })
    return processesIdsInExecution
}

export function getProcessPagesReferences(memoryPageList, diskPageList, process) {
    let processPagesReferences = [];
    for (let i = 0; i < memoryPageList.length; i++) {
        for (let j = 0; j < memoryPageList[i].blockList.length; j++) {
            if(memoryPageList[i].blockList[j].processId === process.id) {
                processPagesReferences.push({pageLocation: "memory", pageReference: memoryPageList[i].id, pageSize: memoryPageList[i].currentPageSize})
                break
            }
        }
    }

    for (let i = 0; i < diskPageList.length; i++) {
        for (let j = 0; j < diskPageList[i].blockList.length; j++) {
            if(diskPageList[i].blockList[j].processId === process.id) {
                processPagesReferences.push({pageLocation: "disk", pageReference: diskPageList[i].id, pageSize: diskPageList[i].currentPageSize})
                break
            }
        }
    }

    return processPagesReferences
}

export function getMaxIdFromProcessList(processList) {
    let max = 0
    for (let i = 0; i < processList.length; i++) {
        for (let j = 0; j < processList[i].length; j++) {
            if(processList[i][j].id > max) {
                max = processList[i][j].id
            }
        }
    }
    return max
}

export function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

export function getAvailableCore(coreList) {
    return coreList.findIndex(function(core) {
        return core.status === 'waiting for process'
    })
}

export function getAvailableProcessAmmount(processListQ) {
    let availableProcess = 0
    let noProcessAvailableToStart = false
    for (let i = 0; i < processListQ.length; i++) {
        availableProcess += processListQ[i].length
        for(let j = 0; j < processListQ[i].length; j++) {
            if (processListQ[i][j].status === 'ready') {
                noProcessAvailableToStart = true
            }
        }
    }
    return [availableProcess, noProcessAvailableToStart]
}

export function sortPriorityQueues(processList) {
    let sortedPriorityQueue = [[], [], [], []]
    for (let i = 0; i < processList.length; i++) {
        for (let j = 0; j < 4; j++) {
            if(processList[i].priority === j) {
                sortedPriorityQueue[j].push(processList[i])
            }
         }
    }
    return sortedPriorityQueue
}

export function getAvailableCoreAmmount(coreList) {
    let availableCores = 0
    for (let i = 0; i < coreList.length; i++) {
        if(coreList[i].status === 'waiting for process') {
            availableCores++
        }
    }

    return availableCores
}

export function sortList(arr, key) {
    let getKey = prop(key)
    return arr.sort(function(a, b){
        if (a.status !== 'executing' && b.status !== 'executing') {
            let x = getKey(a)
            let y = getKey(b)
            return ((x < y) ? -1 : ((x > y) ? 1 : 0))
        } else {
            return 0
        }
    })
}

function prop(key) {
    var keys = key.split('.')

    return keys.reduce.bind(keys, function(obj, name) {
        return obj[name]
    })
}