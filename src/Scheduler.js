import React, { Component } from 'react'
import Process from './Process'
import ProcessQueues from './ProcessQueues'
import Core from './Core'
import FinishedProcessList from './FinishedProcessList'
import AbortedProcessList from './AbortedProcessList'
import { getAlgorithmData } from './Selector'
import { connect } from 'react-redux'
import { createPropsSelector } from 'reselect-immutable-helpers'
import { receiveAlgorithmData } from './Actions'
import {
    getOccupiedPercentageInAllDiskPages,
    getOccupiedPercentageInAllMemoryPages,
    getFreeMemoryAVailability,
    createInitialPagesList,
    sortList,
    randomIntFromInterval,
    getMaxIdFromProcessList,
} from './HelperFunctions'
import Memory from './Memory'
import Disk from './Disk'
import MemoryPageList from './MemoryPageList'
import {
    initSJF,
    algorithmRoundRobinBestFit,
    algorithmRoundRobinMergeFit,
    algorithmPriorityQueueRoundRobin,
} from './algorithms'

class Scheduler extends Component {
    constructor(props) {
        super(props)
        if (this.props.algorithmData.algorithm === '') {
            this.props.history.push('/')
        }

        this._timeoutId = null
        this._unmounted = false

        const algoData = { ...this.props.algorithmData }
        algoData.finishedProcessList = []
        algoData.abortedProcessList = []
        if (algoData.algorithm === 'round-robin' && algoData.algorithmMemoryManager === 'bestFit') {
            algoData.memoryPageList = createInitialPagesList([...algoData.memoryPageList], algoData.pageSize, algoData.memorySize)
            algoData.diskPageList = createInitialPagesList([...algoData.diskPageList], algoData.pageSize, algoData.diskSize)
        }
        this.state = algoData
    }

    componentWillUnmount() {
        this._unmounted = true
        if (this._timeoutId) {
            clearTimeout(this._timeoutId)
            this._timeoutId = null
        }
    }

    componentDidMount() {
        const { algorithm } = this.state
        if (algorithm === 'sjf') {
            initSJF(this)
        } else if (algorithm === 'round-robin') {
            if (this.state.algorithmMemoryManager === 'bestFit') {
                algorithmRoundRobinBestFit(this)
            } else {
                algorithmRoundRobinMergeFit(this)
            }
        } else if (algorithm === 'priority-queue') {
            algorithmPriorityQueueRoundRobin(this)
        }
    }

    startProcessExecution = (freeProcessId, coreIndex, processIndex) => {
        let coreList = this.state.coreList
        let processList = this.state.processList
        processList[processIndex].status = 'executing'
        coreList[coreIndex].processInExecution = 'P' + freeProcessId
        coreList[coreIndex].status = 'executing'
        coreList[coreIndex].currentQuantum = this.state.quantum
        coreList[coreIndex].processInExecutionRemainingTime = processList[processIndex].remainingExecutionTime
        this.setState({ coreList, processList })
    }

    handleClick = () => {
        let totalExecutionTime = randomIntFromInterval(4, 20)
        let priority = randomIntFromInterval(0, 3)
        let bytesToExecute = randomIntFromInterval(32, 1024)

        if (this.state.algorithm !== 'priority-queue') {
            let id = Math.max(...this.state.processList.map(p => p.id))
            let newProcess = {
                id: id + 1,
                status: 'ready',
                totalExecutionTime,
                remainingExecutionTime: totalExecutionTime,
                priority,
                inserted: true,
                bytes: bytesToExecute,
            }
            let processList = [...this.state.processList, newProcess]
            if (this.state.algorithm === 'sjf') {
                processList = sortList(processList, 'totalExecutionTime')
            }
            this.setState({ processList })
        } else {
            let maxId = getMaxIdFromProcessList(this.state.processList) + 1
            let newProcess = {
                id: maxId,
                status: 'ready',
                totalExecutionTime,
                remainingExecutionTime: totalExecutionTime,
                priority,
                inserted: true,
                bytes: bytesToExecute,
            }
            let processList = this.state.processList
            processList[priority].push(newProcess)
            this.setState({ processList })
        }
    }

    render() {
        const { diskSize, diskPageList, memoryPageList, memorySize } = this.state
        return (
            <div>
                <div className="process-scheduler_info">
                    <div>
                        Running Algorithm: <span className="process-scheduler_info-algorithm">{this.state.algorithm}</span>
                    </div>
                    {this.state.algorithm === 'round-robin' && (
                        <div>
                            Page Size: <span className="process-scheduler_info-algorithm">{this.state.pageSize}</span>
                        </div>
                    )}
                    {this.state.algorithm === 'round-robin' && (
                        <div>
                            Disk Size: <span className="process-scheduler_info-algorithm">{this.state.diskSize}</span>
                        </div>
                    )}
                    <div>PIE = Process In Execution</div>
                    <div>TET = Total Execution Time</div>
                    <div>RET = Remaining Execution Time</div>
                    {this.state.algorithm === 'priority-queue' ? (
                        <div>
                            Priorities and Quantums(Q) = (0 = 4 * Q, 1 = 3*Q, 2 = 2*Q, 3 = Q)
                            <div>Quantum Submited (Initial Q) = {this.state.quantum}s</div>
                        </div>
                    ) : <div></div>}
                    <button className="add-process-button" onClick={this.handleClick}>Add Random Process</button>
                </div>

                <div className="section-title">Core List</div>
                <Core cores={this.state.coreList} />

                <div className="section-title">Process List</div>
                {this.state.algorithm === 'priority-queue'
                    ? <ProcessQueues processes={this.state.processList} />
                    : <Process processes={this.state.processList} />
                }

                {this.state.algorithm === 'round-robin' && memorySize > 0 && (
                    <div>
                        <div className="section-title bold">
                            Memory Pages - Size {memorySize} bytes - Occupied Percentage {getOccupiedPercentageInAllMemoryPages(memoryPageList, memorySize)}% - {getFreeMemoryAVailability(memoryPageList, memorySize)} bytes free
                        </div>
                        <MemoryPageList memoryPages={this.state.memoryPageList} />
                    </div>
                )}

                {this.state.algorithm === 'round-robin' && diskSize > 0 && (
                    <div>
                        <div className="section-title bold">
                            HD Pages - Size {diskSize} bytes - Occupied Percentage {getOccupiedPercentageInAllDiskPages(diskPageList, diskSize)}%
                        </div>
                        <Disk diskPages={this.state.diskPageList} />
                    </div>
                )}

                {this.state.algorithmMemoryManager === 'bestFit' ? (
                    <div></div>
                ) : (
                    <div>
                        <div className="section-title">Memory</div>
                        <div className={this.state.algorithm !== 'round-robin' ? 'memory hide' : 'memory'}>
                            <Memory memoryBlocks={this.state.memoryBlocksList.length ? this.state.memoryBlocksList : []} />
                            {this.state.initialMemoryAvailability > 0 ? (
                                <div className="memory-initial">
                                    {this.state.initialMemoryAvailability} bytes {this.state.algorithmMemoryManager === 'mergeFit' ? 'super block' : 'not allocated'}
                                </div>
                            ) : <div className="hide"></div>}
                        </div>
                    </div>
                )}

                <div>
                    <div className="section-title">Finished Process List</div>
                    <FinishedProcessList processes={this.state.finishedProcessList} />
                </div>
                <div>
                    <div className="section-title">Aborted Process List</div>
                    <AbortedProcessList processes={this.state.abortedProcessList} />
                </div>
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

export default connect(mapStateToProps, mapDispatchToProps)(Scheduler)
