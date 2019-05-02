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