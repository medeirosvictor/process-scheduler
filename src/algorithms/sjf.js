import {
    sortList,
    getAvailableCoreAmmount,
} from '../HelperFunctions'

/**
 * Shortest Job First (SJF) scheduling algorithm.
 * Non-preemptive: once a process starts executing, it runs to completion.
 *
 * @param {Component} scheduler - The Scheduler component instance (for state/setState/props)
 */
export function algorithmSJF(scheduler) {
    scheduler._timeoutId = setTimeout(() => {
        if (scheduler._unmounted) return

        let coreList = scheduler.state.coreList
        let processList = scheduler.state.processList
        let finishedProcessList = scheduler.state.finishedProcessList

        let availableCores = getAvailableCoreAmmount(coreList)

        if (processList) {
            // Allocate ready processes to available cores
            for (let i = 0; i < coreList.length; i++) {
                if (coreList[i].status === 'waiting for process' && availableCores > 0) {
                    for (let j = 0; j < processList.length; j++) {
                        if (processList[j].status === 'ready') {
                            let freeProcessId = processList[j].id
                            processList[j].status = 'executing'
                            if (freeProcessId >= 0) {
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

            // Remove processes with 0 remaining time from cores
            for (let i = 0; i < coreList.length; i++) {
                let runningProcessId = coreList[i].processInExecution.substring(1)
                if (runningProcessId !== 'one') {
                    let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
                    if (currentProcess.remainingExecutionTime === 0) {
                        coreList[i].processInExecution = 'none'
                        coreList[i].status = 'waiting for process'
                        coreList[i].processInExecutionRemainingTime = -1
                        availableCores++
                    }
                }
            }

            // Collect finished processes
            let currentFinishedProcesses = processList.filter(process => process.remainingExecutionTime === 0)
            currentFinishedProcesses = currentFinishedProcesses.map(process => {
                process.status = 'finished'
                return process
            })
            Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)

            // Remove finished from active list
            processList = processList.filter(process => process.remainingExecutionTime > 0)

            scheduler.setState({ coreList, processList, finishedProcessList })

            // Tick down executing processes
            for (let i = 0; i < processList.length; i++) {
                if (processList[i].status === 'executing') {
                    processList[i].remainingExecutionTime--
                }
            }

            // Tick down core timers
            for (let i = 0; i < coreList.length; i++) {
                if (coreList[i].status === 'executing') {
                    coreList[i].processInExecutionRemainingTime--
                }
            }

            scheduler.setState({ coreList, processList })
            algorithmSJF(scheduler)
        } else {
            scheduler._timeoutId = setTimeout(() => {
                if (scheduler._unmounted) return
                scheduler.props.history.push('/')
            }, 10000)
        }
    }, 1000)
}

/**
 * Initialize state for SJF: sort process list by execution time.
 */
export function initSJF(scheduler) {
    let sortedProcessList = sortList(scheduler.state.processList, 'totalExecutionTime')
    scheduler.setState({ processList: sortedProcessList })
    algorithmSJF(scheduler)
}
