import {
    getAvailableCoreAmmount,
    getAvailableProcessAmmount,
    getAvailableCore,
} from '../HelperFunctions'

/**
 * Priority Queue Round Robin scheduling algorithm.
 * Processes are organized in 4 priority queues (0-3).
 * Higher priority (lower number) gets more quantum time.
 *
 * @param {Component} scheduler - The Scheduler component instance
 */
export function algorithmPriorityQueueRoundRobin(scheduler) {
    scheduler._timeoutId = setTimeout(() => {
        if (scheduler._unmounted) return

        let coreList = [...scheduler.state.coreList]
        let processListQ = scheduler.state.processList
        let finishedProcessList = scheduler.state.finishedProcessList

        let processListQLength = processListQ.length

        let availableCores = getAvailableCoreAmmount(coreList)
        let availableProcess = getAvailableProcessAmmount(processListQ)[0]
        let isRunnableProcess = getAvailableProcessAmmount(processListQ)[1]

        if (availableProcess > 0) {

            while (availableCores > 0 && isRunnableProcess) {
                for (let j = 0; j < processListQLength; j++) {
                    if (processListQ[j].length) {
                        for (let k = 0; k < processListQ[j].length; k++) {
                            if (processListQ[j][k].status === 'ready' && processListQ[j][k].priority > scheduler.state.lastPriorityAdded) {
                                let coreIndex = getAvailableCore(coreList)
                                if (coreIndex >= 0) {
                                    let freeProcessId = processListQ[j][k].id
                                    processListQ[j][k].status = 'executing'
                                    if (freeProcessId >= 0) {
                                        coreList[coreIndex].processInExecution = 'P' + freeProcessId
                                        coreList[coreIndex].status = 'executing'
                                        let priorityQuantum = getPriorityQuantum(processListQ[j][k].priority, scheduler.state.quantum)
                                        coreList[coreIndex].currentQuantum = priorityQuantum.toString()
                                        coreList[coreIndex].currentPriority = processListQ[j][k].priority
                                        coreList[coreIndex].processInExecutionRemainingTime = processListQ[j][k].remainingExecutionTime
                                        availableCores--
                                        scheduler.setState({
                                            lastPriorityAdded: processListQ[j][k].priority === 3 ? -1 : processListQ[j][k].priority
                                        })
                                    } else {
                                        coreList[coreIndex].processInExecution = 'none'
                                        coreList[coreIndex].status = 'waiting for process'
                                        coreList[coreIndex].quantum = scheduler.state.quantum
                                        coreList[coreIndex].currentPriority = -1
                                        coreList[coreIndex].processInExecutionRemainingTime = -1
                                        availableCores++
                                    }
                                    isRunnableProcess = getAvailableProcessAmmount(processListQ)[1]
                                    break
                                }
                            }
                        }
                    }
                }
            }

            scheduler.setState({ coreList, processList: processListQ })

            // Remove finished processes (remaining time === 0)
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                let currentProcess
                if (runningProcessId !== 'one') {
                    for (let qi = 0; qi < processListQ.length; qi++) {
                        for (let qj = 0; qj < processListQ[qi].length; qj++) {
                            if (processListQ[qi][qj].id.toString() === runningProcessId) {
                                currentProcess = processListQ[qi][qj]
                            }
                        }
                    }
                    if (currentProcess && currentProcess.remainingExecutionTime === 0) {
                        coreList[i].processInExecution = 'none'
                        coreList[i].status = 'waiting for process'
                        coreList[i].currentQuantum = scheduler.state.quantum
                        coreList[i].processInExecutionRemainingTime = -1
                        coreList[i].currentPriority = -1
                        availableCores++
                    }
                }
            }

            // Collect finished processes
            for (let i = 0; i < processListQ.length; i++) {
                let currentFinishedProcesses = processListQ[i].filter(process => process.remainingExecutionTime === 0)
                currentFinishedProcesses = currentFinishedProcesses.map(process => {
                    process.status = 'finished'
                    return process
                })
                Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)
            }

            for (let i = 0; i < processListQ.length; i++) {
                processListQ[i] = processListQ[i].filter(process => process.remainingExecutionTime > 0)
            }

            scheduler.setState({ coreList, processListQ, finishedProcessList })

            // Remove quantum-expired processes
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                let notFinishedProcess
                let notFinishedProcessPriority
                for (let qi = 0; qi < processListQ.length; qi++) {
                    for (let qj = 0; qj < processListQ[qi].length; qj++) {
                        if (processListQ[qi][qj].id.toString() === runningProcessId) {
                            notFinishedProcess = processListQ[qi][qj]
                            notFinishedProcessPriority = notFinishedProcess.priority
                        }
                    }
                }
                if (notFinishedProcess && coreList[i].currentQuantum === 0 && notFinishedProcess.remainingExecutionTime > 0) {
                    coreList[i].processInExecution = 'none'
                    coreList[i].status = 'waiting for process'
                    coreList[i].currentQuantum = scheduler.state.quantum
                    coreList[i].currentPriority = -1
                    availableCores++
                    processListQ[notFinishedProcessPriority] = processListQ[notFinishedProcessPriority].filter(process => process.id.toString() !== runningProcessId)
                    notFinishedProcess.status = 'ready'
                    processListQ[notFinishedProcessPriority] = [...processListQ[notFinishedProcessPriority], notFinishedProcess]
                }
            }
            scheduler.setState({ coreList, processList: processListQ })

            // Tick down executing processes
            for (let i = 0; i < processListQ.length; i++) {
                for (let j = 0; j < processListQ[i].length; j++) {
                    if (processListQ[i][j].status === 'executing') {
                        processListQ[i][j].remainingExecutionTime--
                    }
                }
            }

            // Tick down quantum on working cores
            for (let i = 0; i < coreList.length; i++) {
                if (coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
                    coreList[i].currentQuantum--
                    coreList[i].processInExecutionRemainingTime--
                }
            }

            scheduler.setState({ coreList, processList: processListQ })
            algorithmPriorityQueueRoundRobin(scheduler)
        } else {
            alert("Process scheduler finished it's job")
        }
    }, 1000)
}

/**
 * Get quantum multiplier based on priority level.
 * Priority 0 = 4x, 1 = 3x, 2 = 2x, 3 = 1x
 */
function getPriorityQuantum(priority, baseQuantum) {
    const multipliers = { 0: 4, 1: 3, 2: 2, 3: 1 }
    return baseQuantum * (multipliers[priority] || 1)
}
