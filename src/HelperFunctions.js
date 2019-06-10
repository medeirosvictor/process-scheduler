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

export function abortProcess(processList, abortedProcessList, process) {
    let abortedProcess = processList.filter(function(p) {
        return p.id === process.id
    })
    processList = processList.filter(function(p) {
        return p.id !== process.id
    })

    abortedProcess[0].status = 'aborted: out of memory'
    abortedProcessList = [...abortedProcessList, abortedProcess[0]]

    return [processList, abortedProcessList]
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