import { getAvailableCoreAmmount, sortList } from '../HelperFunctions'
import { updateCoreProcessLists } from '../Actions'

export const algorithmSJF = (coreList, processList, finishedProcessList, isFirst) => (dispatch) => {
    if (isFirst) {
        let sortedProcessList = sortList(processList, 'totalExecutionTime')
        processList = sortedProcessList
    }
    setTimeout(() => {
        let availableCores = getAvailableCoreAmmount(coreList)

        //Keep running until empty process list
        if (processList) {

            // Allocating Process to Cores
            for (let i = 0; i < coreList.length; i++) {
                if(coreList[i].status === 'waiting for process' && availableCores > 0) {
                    for (let j = 0; j < processList.length; j++) {
                        if(processList[j].status === 'ready') {
                            let freeProcessId = processList[j].id
                            processList[j].status = 'executing'
                            if(freeProcessId >= 0) {
                                coreList[i].processInExecution = 'P' + freeProcessId
                                coreList[i].status = 'executing'
                                coreList[i].processInExecutionRemainingTime = processList[j].remainingExecutionTime
                                availableCores--
                            } else {
                                coreList[i].processInExecution = 'none'
                                coreList[i].status = 'waiting for process'
                                coreList[i].processInExecutionRemainingTime = -1
                                availableCores++
                            }
                            break
                        } 
                    }
                }
            }
            dispatch(updateCoreProcessLists({coreList, processList, finishedProcessList}))

            //Remove 0 Remaining Time Process
            for (let i = 0; i < coreList.length; i++) {
                    let runningProcessId = coreList[i].processInExecution.substring(1)
                    if (runningProcessId !== 'none'.substring(1)) {
                        let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
                        if(currentProcess.remainingExecutionTime === 0) {
                            coreList[i].processInExecution = 'none'
                            coreList[i].status = 'waiting for process'
                            coreList[i].processInExecutionRemainingTime = -1
                            availableCores++
                        }
                    }
                }

            let currentFinishedProcesses = processList.filter(function(process) {
                return process.remainingExecutionTime === 0
            })
            currentFinishedProcesses = currentFinishedProcesses.map(function(process){
                process.status = 'finished'
                return process
            })

            Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)

            processList = processList.filter(function(process) {
                return process.remainingExecutionTime > 0
            })

            dispatch(updateCoreProcessLists({coreList, processList, finishedProcessList}))

            // Updates Executing Processes
            for (let i = 0; i < coreList.length; i++) {
                if(coreList[i].status === 'executing') {
                    coreList[i].processInExecutionRemainingTime--
                }
            }
            for (let i = 0; i < processList.length; i++) {
                if(processList[i].status === 'executing') {
                    processList[i].remainingExecutionTime--
                }
            }

            dispatch(updateCoreProcessLists({coreList, processList, finishedProcessList}))

            dispatch(algorithmSJF(coreList, processList, finishedProcessList, false))
        } else {
            setTimeout(() => {
                this.props.history.push('/')
            }, 10000)
        }
    }, 1000)
}