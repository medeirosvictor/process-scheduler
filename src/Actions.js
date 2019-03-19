import { createAction } from 'redux-actions'
import { getAvailableCoreAmmount, sortList } from './HelperFunctions'

//Action Creation is done here, the paramenter is a message which should basically inform what the action is doing
//to the Redux Store data
export const receiveAlgorithmData = createAction('receives algorithm data')

export const resetAlgorithmData = createAction('resets algorithm data')

export const updateCoreProcessLists = createAction('updates core list and process list')

export const algorithmSJF = (coreList, processList, isFirst) => (dispatch) => {
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
                                availableCores--
                            } else {
                                coreList[i].processInExecution = 'none'
                                coreList[i].status = 'waiting for process'
                                availableCores++
                            }
                            break
                        } 
                    }
                }
            }

            //Remove 0 Remaining Time Process
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                if (runningProcessId !== 'none'.substring(1)) {
                    let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
                    if(currentProcess.remainingExecutionTime === 0) {
                        coreList[i].processInExecution = 'none'
                        coreList[i].status = 'waiting for process'
                        availableCores++
                    }
                }
            }

            processList = processList.filter(function(process) {
                return process.remainingExecutionTime > 0
            })

            dispatch(updateCoreProcessLists({coreList, processList}))

            // Updates Executing Processes
            for (let i = 0; i < processList.length; i++) {
                if(processList[i].status === 'executing') {
                    processList[i].remainingExecutionTime--
                }
            }

            dispatch(updateCoreProcessLists({coreList, processList}))
            dispatch(algorithmSJF(coreList, processList))
        } else {
            alert("Process Scheduler has finished it's job")
        }
    }, 1000)
}
