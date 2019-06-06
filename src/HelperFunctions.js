export function getFreeBlocksOnMemory(memoryPageList) {
    return memoryPageList.filter(function (block) {
        return block.type === 'free'
    })
}

export function getRemovablePagesFromRAM(memoryPageList, processIdsInExecution) {
    let removablePagesIdsFromRAM = []
    for (let i = 0; i < memoryPageList.length; i++) {
        let memoryPageProcessIds = memoryPageList[i].blockList.map(process => process.id)
        let found = memoryPageProcessIds.some(processId => processIdsInExecution.includes(processId))
        if(!found) {
            removablePagesIdsFromRAM.push(i)
        }
    }

    return removablePagesIdsFromRAM
}

export function getProcessesIdsInExecution(processList) {
    let processesIdsInExecution = []
    processList.map(function(process) {
        if(process.status === 'executing') {processesIdsInExecution.push(process.id)}
    })
    return processesIdsInExecution
}

export function getProcessPagesReferences(memoryPageList, diskPageList, process) {
    let processPagesReferences = [];
    for (let i = 0; i < memoryPageList.length; i++) {
        for (let j = 0; j < memoryPageList[i].blockList.length; j++) {
            if(memoryPageList[i].blockList[j].id === process.id) {
                processPagesReferences.push({pageLocation: "memory", pageReference: i})
            }
        }
    }

    for (let i = 0; i < diskPageList.length; i++) {
        for (let j = 0; j < diskPageList[i].processList.length; j++) {
            if(diskPageList[i].processList[j].id === process.id) {
                processPagesReferences.push({pageLocation: "disk", pageReference: i})
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