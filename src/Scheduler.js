import React, { Component } from 'react'
import Process from './Process'
import ProcessQueues from './ProcessQueues'
import Core from './Core'
import { getAlgorithmData } from './Selector'
import { connect } from 'react-redux'
import { createPropsSelector } from 'reselect-immutable-helpers'
import { receiveAlgorithmData } from './Actions'
import { sortList, getAvailableCoreAmmount, randomIntFromInterval, getAvailableProcessAmmount, getAvailableCore, getMaxIdFromProcessList} from './HelperFunctions'

class Scheduler extends Component {
    /** 
    * Input
    *  - Algorithm Selector output
    *  - Algorithm Type
    *  - List of Cores
    *  - List of Processes
    */

    constructor(props) {
        super(props)
        if (this.props.algorithmData.algorithm === '') {
            this.props.history.push('/')
        }

        this.state = this.props.algorithmData
    }


    componentDidMount() { 
        let algorithm = this.state.algorithm
        if(algorithm === 'sjf') {
            let sortedProcessList = sortList(this.state.processList, 'totalExecutionTime')
            this.setState({
                processList: sortedProcessList
            })
            this.algorithmSJF()
        } else if(algorithm === 'round-robin') {
            this.algorithmRoundRobin()
        } else if(algorithm === 'priority-queue') {
            // this.algorithmPriorityQueueRoundRobin()
        }
    }

    algorithmSJF() {
        setTimeout(() => {

            let coreList = this.state.coreList
            let processList = this.state.processList

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

                this.setState({
                    coreList: coreList,
                    processList: processList
                })

                // Updates Executing Processes
                for (let i = 0; i < processList.length; i++) {
                    if(processList[i].status === 'executing') {
                        processList[i].remainingExecutionTime--
                    }
                }

                this.setState({
                    coreList: coreList,
                    processList: processList
                })
                this.algorithmSJF()
            } else {
                alert("Process Scheduler has finished it's job")
                this.props.history.push('/')
            }
        }, 1000)
    }

    algorithmRoundRobin() {
        setTimeout(() => {

            let coreList = [...this.state.coreList]
            let processList = [...this.state.processList]

            let availableCores = getAvailableCoreAmmount(coreList)

            //Keep running until empty process list
            if (processList.length) {

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
                                    coreList[i].quantum = this.state.quantum
                                    availableCores--
                                    this.setState({
                                        coreList: coreList,
                                        processList: processList
                                    })
                                } else {
                                    coreList[i].processInExecution = 'none'
                                    coreList[i].status = 'waiting for process'
                                    coreList[i].quantum = this.state.quantum
                                    availableCores++
                                }
                                break
                            }
                        }
                    }
                }
                this.setState({
                    coreList: coreList,
                    processList: processList
                })

                // Remove finished processes (Remaining Execution Time === 0)
                for (let i = 0; i < coreList.length; i++) {
                    let runningProcessId = coreList[i].processInExecution.substring(1)
                    if (runningProcessId !== 'none'.substring(1)) {
                        let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
                        if(currentProcess.remainingExecutionTime === 0) {
                            coreList[i].processInExecution = 'none'
                            coreList[i].status = 'waiting for process'
                            coreList[i].currentQuantum = this.state.quantum
                            availableCores++
                        }
                    }
                }
                processList = processList.filter(function(process) {
                    return process.remainingExecutionTime > 0
                })

                // Remove process w/ core quantum === 0 but w/ Remaining Time to Execute > 0
                for (let i = 0; i < coreList.length; i++) {
                    let runningProcessId = coreList[i].processInExecution.substring(1)
                    let notFinishedProcess = processList.find(process => process.id.toString() === runningProcessId)
                    if(coreList[i].currentQuantum === 0 && notFinishedProcess.remainingExecutionTime > 0) {
                        coreList[i].processInExecution = 'none'
                        coreList[i].status = 'waiting for process'
                        coreList[i].currentQuantum = this.state.quantum
                        availableCores++
                        processList = processList.filter(function(process) {
                            return process.id.toString() !== runningProcessId
                        }) 
                        notFinishedProcess.status = 'ready'
                        processList = [...processList, notFinishedProcess]
                    }
                }
                this.setState({
                    coreList: coreList,
                    processList: processList
                })

                // Updates Executing Processes
                for (let i = 0; i < processList.length; i++) {
                    if(processList[i].status === 'executing') {
                        processList[i].remainingExecutionTime--
                    }
                }
                // Updates Quantum on working Cores
                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
                        coreList[i].currentQuantum--
                    }
                }

                this.setState({
                    coreList: coreList,
                    processList: processList
                })
                this.algorithmRoundRobin()
            } else {
                alert("Process Scheduler has finished it's job")
                this.props.history.push('/')
            }
        }, 1000)
    }

    algorithmPriorityQueueRoundRobin() {
        setTimeout(() => {

            let coreList = [...this.state.coreList]
            let processListQ = this.state.processList

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
                            coreList[i].currentPriority = -1
                            availableCores++
                        }
                    }
                }

                for(let i =0; i < processListQ.length; i++) {
                    processListQ[i] = processListQ[i].filter(function(process) {
                        return process.remainingExecutionTime > 0
                    })
                }
                this.setState({
                    coreList: coreList,
                    processList: processListQ
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

    handleClick = (e) => {
        // eslint-disable-next-line
        let totalExecutionTime = randomIntFromInterval(4, 20);
        let priority = randomIntFromInterval(0, 3);
        let processList = this.state.processList
        if (this.state.algorithm !== 'priority-queue') {
            let id = Math.max.apply(Math, this.state.processList.map(function(process) { return process.id; }));
            let newProcess = {id: id + 1, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, inserted: true}
            processList = [...this.state.processList, newProcess]
            if (this.state.algorithm === 'sjf') {
                processList = sortList(processList, 'totalExecutionTime')
            }
            this.setState({
                processList: processList
            })
        } else {
            let maxId = getMaxIdFromProcessList(this.state.processList) + 1
            let newProcess = {id: maxId, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, inserted: true}
            processList[priority].push(newProcess)
            this.setState({
                processList: processList
            })
        }
    }

    render () {
        return (
            <div>
                <div className="process-scheduler_info">
                    <div>
                        Running Algorithm: <span className="process-scheduler_info-algorithm">{this.state.algorithm}</span>
                    </div>
                    <div>
                        PIE = Process In Execution
                    </div>
                    <div>
                        TET = Total Execution Time
                    </div>
                    <div>
                        RET = Remaining Execution Time
                    </div>
                    {this.state.algorithm === 'priority-queue' ? <div>Priorities and Quantums(Q) = (0 = 4 * Q, 1 =  3*Q, 2 = 2*Q, 3 = Q)<div>Quantum Submited (Initial Q) = {this.state.quantum}s</div></div> : <div></div>}
                    <button className="add-process-button" onClick={this.handleClick}>Add Random Process</button>
                </div>
                <Core cores={this.state.coreList} />
                {this.state.algorithm === 'priority-queue' ? <ProcessQueues processes={this.state.processList}/> : <Process processes={this.state.processList}/>}
            </div>
        )
    }
}

const mapDispatchToProps = {
    receiveAlgorithmData
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData
})

export default connect(mapStateToProps, mapDispatchToProps) (Scheduler)
