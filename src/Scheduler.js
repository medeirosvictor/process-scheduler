import React, { Component } from 'react'
import Process from './Process'
import Core from './Core'
import { getAlgorithmData } from './Selector'
import { connect } from 'react-redux'
import { createPropsSelector } from 'reselect-immutable-helpers'
import { receiveAlgorithmData } from './Actions'
import { sortList, getAvailableCoreAmmount, randomIntFromInterval } from './HelperFunctions'

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
            let processList = sortList(this.state.processList, 'totalExecutionTime')
            this.setState({
                processList: processList
            })
            this.algorithmSJF()
        } else if(algorithm === 'round-robin') {
            console.log('Running Round Robin algorithm')
            this.algorithmRoundRobin()
        } else if(algorithm === 'priority-queue') {
            console.log('Running Priority Queue with Round Robin algorithm')
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
        }, 1500)
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

                // Delay for perceiving front-end changes
                setTimeout(() => {

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
                }, 500)
            } else {
                alert("Process Scheduler has finished it's job")
                this.props.history.push('/')
            }
        }, 500)
    }

    handleClick = (e) => {
        // eslint-disable-next-line
        let id = Math.max.apply(Math, this.state.processList.map(function(process) { return process.id; }));
        let totalExecutionTime = randomIntFromInterval(4, 20);
        let priority = randomIntFromInterval(0, 3);
        let process = {id: id + 1, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority}
        let processList = [...this.state.processList, process]
        if (this.state.algorithm === 'sjf') {
            processList = sortList(processList, 'totalExecutionTime')
        }
        this.setState({
            processList: processList
        })
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
                    <button className="add-process-button" onClick={this.handleClick}>Add Random Process</button>
                </div>
                <Core cores={this.state.coreList} />
                <Process processes={this.state.processList}/>
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
