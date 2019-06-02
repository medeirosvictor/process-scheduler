// export function processExecutionPagesInHD(currentProcess) {
//     let res = false

//     for (let i = 0; i < diskPageList.length; i++) {
//         for (let k = 0; k < diskPageList[i].processList; k++) {
//             if(currentProcess.id === diskPageList[i].processList[k].processId) {
//                 res.push(i)
//                 break
//             }
//         }
//     }

//     return res
// }

export function hasProcessAlreadyStarted(memoryPageList, diskPageList, currentProcess) {
    for (let i = 0; i < memoryPageList.length; i++) {
        for (let k = 0; k < memoryPageList[i].processList; k++) {
            if(currentProcess.id === memoryPageList[i].processList[k].processId) {
                return true
            }
        }
    }

    for (let i = 0; i < diskPageList.length; i++) {
        for (let k = 0; k < diskPageList[i].processList; k++) {
            if(currentProcess.id === diskPageList[i].processList[k].processId) {
                return true
            }
        }
    }

    return false
}

export function getFreeSuitableBlockFromPages(memoryPageList, requestSize) {
    let minSize = requestSize
    let bestFreeSuitableBlock = false
    for (let i = 0; i < memoryPageList.length; i++) {
        for (let k = 0; k < memoryPageList[i].processList; k++) {
            if (memoryPageList[i].processList[k].type === 'free') {
                let aux = memoryPageList[i].processList[k].requestSize - requestSize
                if (aux < minSize) {
                    minSize = aux
                    bestFreeSuitableBlock = {pageRef: i, blockRef: k}
                }
            }
        }
    }

    return bestFreeSuitableBlock
}

export function getPageSuitableForRemoval(memoryPageList, processIdsInExecution) {
    for (let i = 0; i < memoryPageList.length; i++) {
        let memoryPageProcessIds = memoryPageList[i].processList.map(process => process.id)
        let found = memoryPageProcessIds.some(processId => processIdsInExecution.includes(processId))
        if(!found) {
            return i
        }
    }

    return false
}

export function getAmmountOfFreeSpaceFromRemovablePagesFromMemory(memoryPageList, processIdsInExecution) {
    let sum = 0
    for (let i = 0; i < memoryPageList.length; i++) {
        let memoryPageProcessIds = memoryPageList[i].processList.map(process => process.id)
        let found = memoryPageProcessIds.some(processId => processIdsInExecution.includes(processId))
        if(!found) {
            sum += memoryPageList[i].currentPageSize 
        }
    }

    return sum
}

export function freeCoreFromProcess(coreList, processId, quantum) {
    for (let k = 0; k < coreList.length; k++) {
        if (coreList[k].processInExecution.substring(1) === processId.toString()) {
            coreList[k].processInExecution = 'none'
            coreList[k].status = 'waiting for process'
            coreList[k].currentQuantum = quantum
        }
    }

    return coreList
}

export function removeProcessFromPages(memoryPageList, processId) {
    for(let k = 0; k < memoryPageList.length; k++) {
        for(let j = 0; j < memoryPageList[k].processList.length; j++) {
            if(memoryPageList[k].processList[j].processId === processId) {
                memoryPageList[k].currentPageSize = memoryPageList[k].currentPageSize - memoryPageList[k].processList[j].requestSize
                memoryPageList[k].processList[j].processId = null
                memoryPageList[k].processList[j].currentRequestSize = 0
                memoryPageList[k].processList[j].type = 'free'
            }
        }
    }
    return memoryPageList
}

export function getProcessIdsInExecution(coreList) {
    let arr = []
    coreList.map(function(core) {
        if (core.status === 'executing') {
            arr.push(parseInt(core.processInExecution.substring(1)))
        }
    })

    return arr
}

export function getFuturePercentage(memoryPageList, bytesAdded, memorySize) {
    return (getOccupiedBytesInAllMemoryPages(memoryPageList) + bytesAdded) * 100 / memorySize
}

export function getOccupiedBytesInAllMemoryPages(memoryPageList) {
    let currentOccupiedBytesInAllMemoryPages = 0
    for (let i = 0; i < memoryPageList.length; i++) {
        currentOccupiedBytesInAllMemoryPages += memoryPageList[i].currentPageSize
    }

    return currentOccupiedBytesInAllMemoryPages
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