import { getAvailableCoreAmmount, getAvailableProcessAmmount, getAvailableCore } from '../HelperFunctions'
import { updateCoreProcessLists } from '../Actions'

export const algorithmPriorityQueueRoundRobin = (algorithmData) => (dispatch) => {
    setTimeout(() => {

        let coreList = algorithmData.coreList
        let processListQ = algorithmData.processList
        let finishedProcessList = algorithmData.finishedProcessList

        let processListQLength = processListQ.length

        let availableCores = getAvailableCoreAmmount(coreList)
        let availableProcess = getAvailableProcessAmmount(processListQ)[0]
        let isRunnableProcess = getAvailableProcessAmmount(processListQ)[1]

        //Keep running until empty process list
        if (availableProcess > 0) {

            while (availableCores > 0 && isRunnableProcess) {
                for (let j = 0; j < processListQLength; j++) {
                    if (processListQ[j].length) {
                        // Going through column
                        for (let k = 0; k < processListQ[j].length; k++) {
                            if (processListQ[j][k].status === 'ready' && processListQ[j][k].priority > this.state.lastPriorityAdded){
                                let coreIndex = getAvailableCore(coreList)
                                if (coreIndex >= 0) {
                                    let freeProcessId = processListQ[j][k].id
                                    processListQ[j][k].status = 'executing'
                                    if(freeProcessId >= 0) {
                                        coreList[coreIndex].processInExecution = 'P' + freeProcessId
                                        coreList[coreIndex].status = 'executing'
                                        let priorityQuantum
                                        if (processListQ[j][k].priority === 0) {
                                            priorityQuantum = this.state.quantum * 4
                                        } else if (processListQ[j][k].priority === 1) {
                                            priorityQuantum = this.state.quantum * 3
                                        } else if (processListQ[j][k].priority === 2) {
                                            priorityQuantum = this.state.quantum * 2
                                        } else if (processListQ[j][k].priority === 3) {
                                            priorityQuantum = this.state.quantum
                                        }
                                        coreList[coreIndex].currentQuantum = priorityQuantum.toString()
                                        coreList[coreIndex].currentPriority = processListQ[j][k].priority
                                        coreList[coreIndex].processInExecutionRemainingTime = processListQ[j][k].remainingExecutionTime
                                        availableCores--
                                        if (processListQ[j][k].priority === 3) {
                                            this.setState({
                                                lastPriorityAdded: -1
                                            })
                                        } else {
                                            this.setState({
                                                lastPriorityAdded: processListQ[j][k].priority
                                            })
                                        }
                                    } else {
                                        coreList[coreIndex].processInExecution = 'none'
                                        coreList[coreIndex].status = 'waiting for process'
                                        coreList[coreIndex].quantum = this.state.quantum
                                        coreList[coreIndex].currentPriority = -1
                                        coreList[coreIndex].processInExecutionRemainingTime = -1
                                        availableCores++
                                    }
                                    isRunnableProcess = getAvailableProcessAmmount(processListQ)[1]
                                    break
                                }
                            } else {
                                continue
                            }
                        }
                    }
                }
            }

            this.setState({
                coreList: coreList,
                processList: processListQ
            })

            // Remove finished processes (Remaining Execution Time === 0)
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                let currentProcess
                if (runningProcessId !== 'none'.substring(1)) {
                    for(let i =0; i < processListQ.length; i++) {
                        for(let j = 0; j < processListQ[i].length; j++) {
                            if (processListQ[i][j].id.toString() === runningProcessId) {
                                currentProcess = processListQ[i][j]
                            }
                        }
                    }
                    if(currentProcess && currentProcess.remainingExecutionTime === 0) {
                        coreList[i].processInExecution = 'none'
                        coreList[i].status = 'waiting for process'
                        coreList[i].currentQuantum = this.state.quantum
                        coreList[i].processInExecutionRemainingTime = -1
                        coreList[i].currentPriority = -1
                        availableCores++
                    }
                }
            }

            for (let i = 0; i < processListQ.length; i++) {
                let currentFinishedProcesses = processListQ[i].filter(function(process) {
                    return process.remainingExecutionTime === 0
                })

                currentFinishedProcesses = currentFinishedProcesses.map(function(process){
                    process.status = 'finished'
                    return process
                })

                Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)
            }



            for(let i =0; i < processListQ.length; i++) {
                processListQ[i] = processListQ[i].filter(function(process) {
                    return process.remainingExecutionTime > 0
                })
            }

            this.setState({
                coreList,
                processListQ,
                finishedProcessList
            })

            // Remove process w/ core quantum === 0 but w/ Remaining Time to Execute > 0
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                let notFinishedProcess
                let notFinishedProcessPriority
                for(let i =0; i < processListQ.length; i++) {
                    for(let j = 0; j < processListQ[i].length; j++) {
                        if (processListQ[i][j].id.toString() === runningProcessId) {
                            notFinishedProcess = processListQ[i][j]
                            notFinishedProcessPriority = notFinishedProcess.priority
                        }
                    }
                }
                if(notFinishedProcess && coreList[i].currentQuantum === 0 && notFinishedProcess.remainingExecutionTime > 0) {
                    coreList[i].processInExecution = 'none'
                    coreList[i].status = 'waiting for process'
                    coreList[i].currentQuantum = this.state.quantum
                    coreList[i].currentPriority = -1
                    availableCores++
                    processListQ[notFinishedProcessPriority] = processListQ[notFinishedProcessPriority].filter(function(process) {
                        return process.id.toString() !== runningProcessId
                    })
                    notFinishedProcess.status = 'ready'
                    processListQ[notFinishedProcessPriority] = [...processListQ[notFinishedProcessPriority], notFinishedProcess]
                }
            }
            this.setState({
                coreList: coreList,
                processList: processListQ
            })

            // Updates Executing Processes
            for (let i = 0; i < processListQ.length; i++) {
                for(let j = 0; j < processListQ[i].length; j++) {
                    if(processListQ[i][j].status === 'executing') {
                        processListQ[i][j].remainingExecutionTime--
                    }
                }
            }

            // Updates Quantum on working Cores
            for (let i = 0; i < coreList.length; i++) {
                if(coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
                    coreList[i].currentQuantum--
                    coreList[i].processInExecutionRemainingTime--
                }
            }

            this.setState({
                coreList: coreList,
                processList: processListQ
            })
            this.algorithmPriorityQueueRoundRobin()
        } else {
            alert("Process scheduler finished it's job")
        }
    }, 1000)
}