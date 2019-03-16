import React, { Component } from 'react'
import Process from './Process'
import Core from './Core'
import { getAlgorithmData } from './Selector'
import { connect } from 'react-redux'
import { createPropsSelector } from 'reselect-immutable-helpers'
import { receiveAlgorithmData } from './Actions'
import { sortList } from './HelperFunctions'

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
            console.log('Running SJF algorithm')
            let processList = sortList(this.state.processList, 'totalExecutionTime')
            this.setState({
                processList: processList
            })
            this.algorithmSJF()
        } else if(algorithm === 'round-robin') {
            console.log('Running Round Robin algorithm')
        } else if(algorithm === 'priority-queue') {
            console.log('Running Priority Queue with Round Robin algorithm')
        }
    }

    algorithmSJF() {
        // Sort Processes on Shortest Job First
        // Run the Algorithm

        setTimeout(() => {
            //is core empty ?
            let availableCores = 0
            let coreList = [...this.state.coreList]
            for (let i = 0; i < coreList.length; i++) {
                if(coreList[i].status === 'waiting for process') {
                    availableCores++
                }
            }

            if (this.state.processList.length) {
                let freeProcessId
                
                let processList = this.state.processList

                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'waiting for process' && availableCores > 0) {
                        for (let j = 0; j < processList.length; j++) {
                            if(processList[j].status === 'ready') {
                                freeProcessId = processList[j].id
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
                let doneProcessID = []
                for (let i = 0; i < processList.length; i++) {
                    if(processList[i].remainingExecutionTime === 0) {
                        doneProcessID.push(processList[i].id.toString())
                    } 
                }

                if (doneProcessID.length) {
                    for (let i = 0; i < coreList.length; i++) {
                        if(coreList[i].status === 'executing' && doneProcessID.indexOf(coreList[i].processInExecution.substring(1)) > -1 ) {
                            coreList[i].processInExecution = 'none'
                            coreList[i].status = 'waiting for process'
                            availableCores++
                        }
                    }
                }
                this.setState({
                    coreList: coreList
                })

                processList = processList.filter(function(process) {
                    if (process.remainingExecutionTime === 0) {
                        doneProcessID = process.id
                    }
                    return process.remainingExecutionTime > 0
                })
                this.setState({
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

    handleClick = (e) => {
        // eslint-disable-next-line
        let id = Math.max.apply(Math, this.state.processList.map(function(process) { return process.id; }));
        let process = {id: id + 1, status: 'ready', totalExecutionTime: 6, remainingExecutionTime: 2, priority: 3}
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
                        RPT = Remaining Execution Time
                    </div>
                    <button onClick={this.handleClick}>Add Random Process</button>
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
