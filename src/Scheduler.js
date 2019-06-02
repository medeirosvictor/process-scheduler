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
import { sortList, getAvailableCoreAmmount, randomIntFromInterval, getAvailableProcessAmmount, getAvailableCore, getMaxIdFromProcessList} from './HelperFunctions'
import Memory from './Memory';
import Disk from './Disk';
import MemoryPageList from './MemoryPageList';

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
        this.state.finishedProcessList = []
        this.state.abortedProcessList = []
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
            if (this.state.algorithmMemoryManager === 'bestFit') {
                this.algorithmRoundRobinBestFit()
            } else {
                this.algorithmRoundRobinMergeFit()
            }
        } else if(algorithm === 'priority-queue') {
            this.algorithmPriorityQueueRoundRobin()
        }
    }

    algorithmSJF() {
        setTimeout(() => {

            let coreList = this.state.coreList
            let processList = this.state.processList
            let finishedProcessList = this.state.finishedProcessList

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

                this.setState({
                    coreList,
                    processList,
                    finishedProcessList
                })

                // Updates Executing Processes
                for (let i = 0; i < processList.length; i++) {
                    if(processList[i].status === 'executing') {
                        processList[i].remainingExecutionTime--
                    }
                }

                // Updates Quantum on working Cores
                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'executing') {
                        coreList[i].processInExecutionRemainingTime--
                    }
                }

                this.setState({
                    coreList: coreList,
                    processList: processList
                })
                this.algorithmSJF()
            } else {
                setTimeout(() => {
                    this.props.history.push('/')
                }, 10000)
            }
        }, 1000)
    }

    algorithmRoundRobinBestFit() {
        setTimeout(() => {

            let coreList = [...this.state.coreList]
            let processList = [...this.state.processList]
            let freeMemoryBlocks = [...this.state.freeMemoryBlocks]
            let busyMemoryBlocks = [...this.state.busyMemoryBlocks]
            let memoryBlocksList = [...this.state.memoryBlocksList]
            let initialMemoryAvailability = this.state.initialMemoryAvailability
            let finishedProcessList = this.state.finishedProcessList
            let abortedProcessList = this.state.abortedProcessList
            let diskPageList = this.state.diskPageList
            let memoryPageList = this.state.memoryPageList
            let pageSize = this.state.pageSize
            let diskSize = this.state.diskSize

            let availableCores = getAvailableCoreAmmount(coreList)

            //Keep running until empty process list
            if (processList.length) {
                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'waiting for process' && availableCores > 0) {
                        for (let j = 0; j < processList.length; j++) {
                            if(processList[j].status === 'ready') {
                                let freeProcessId = processList[j].id

                                // Best Fit

                                //Initial start case, no blocks free yet
                                let busyBlock = busyMemoryBlocks.filter(function(block) {
                                    return block.pid === freeProcessId
                                })
                                if (initialMemoryAvailability > 0 && processList[j].bytes <= initialMemoryAvailability && busyBlock.length === 0) {
                                    initialMemoryAvailability -= processList[j].bytes
                                    busyMemoryBlocks = [...busyMemoryBlocks, {id: memoryBlocksList.length, size: processList[j].bytes, reqsize: processList[j].bytes, pid: freeProcessId, type: 'busy'}]
                                    memoryBlocksList = [...memoryBlocksList, {id: memoryBlocksList.length, size: processList[j].bytes, reqsize: processList[j].bytes, pid: freeProcessId, type: 'busy'}]
                                    this.startProcessExecution(freeProcessId, i, j)
                                    availableCores--

                                    //create page list or add to existing page list
                                    this.addBlockToMemoryPage(processList[j], memoryPageList, pageSize)
                                    
                                    this.setState({
                                        busyMemoryBlocks,
                                        memoryBlocksList,
                                        initialMemoryAvailability
                                    })
                                    debugger
                                    break
                                }
                                //Already allocated blocks case
                                else {
                                    if (busyBlock.length){
                                        availableCores--
                                        this.startProcessExecution(freeProcessId, i, j)
                                        this.setState({
                                            coreList,
                                            processList,
                                            busyMemoryBlocks,
                                            memoryBlocksList,
                                            initialMemoryAvailability
                                        })
                                        break
                                    }
                                    if (freeMemoryBlocks.length) {
                                        let coreTracker = availableCores

                                        // Find best available block
                                        let minSize = processList[j].bytes + 1
                                        let minSizeBlock
                                        for (let k = 0; k < freeMemoryBlocks.length; k++) {
                                            if(processList[j].bytes <= freeMemoryBlocks[k].size) {
                                                let aux = freeMemoryBlocks[k].size - processList[j].bytes
                                                if (aux < minSize) {
                                                    minSize = aux
                                                    minSizeBlock = freeMemoryBlocks[k]
                                                }
                                            }
                                        }
                                        if (minSizeBlock) {
                                            if(freeProcessId >= 0) {
                                                minSizeBlock.pid = freeProcessId
                                                minSizeBlock.type = 'busy'
                                                minSizeBlock.reqsize = processList[j].bytes
                                                busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]

                                                // eslint-disable-next-line
                                                freeMemoryBlocks = freeMemoryBlocks.filter(function(block) {
                                                    return block.id !== minSizeBlock.id
                                                })

                                                // eslint-disable-next-line
                                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                                    if (block.id === minSizeBlock.id) {
                                                        block.pid = freeProcessId
                                                        block.type = 'busy'
                                                        block.reqsize = processList[j].bytes
                                                    }
                                                    return block
                                                })
                                                processList[j].status = 'executing'
                                                coreList[i].processInExecution = 'P' + freeProcessId
                                                coreList[i].status = 'executing'
                                                coreList[i].quantum = this.state.quantum
                                                coreList[i].processInExecutionRemainingTime = processList[j].remainingExecutionTime
                                                availableCores--

                                                this.addBlockToMemoryPage(processList[j], memoryPageList, pageSize)

                                                this.setState({
                                                    coreList,
                                                    processList,
                                                    freeMemoryBlocks,
                                                    busyMemoryBlocks,
                                                    memoryBlocksList
                                                })
                                                debugger
                                            } else {
                                                coreList[i].processInExecution = 'none'
                                                coreList[i].status = 'waiting for process'
                                                coreList[i].quantum = this.state.quantum
                                                coreList[i].processInExecutionRemainingTime = -1
                                                availableCores++
                                            }
                                            break
                                        }
                                        if (coreTracker === availableCores) {
                                            //add to aborted list
                                            let abortedProcess = processList.filter(function(process) {
                                                return process.id === freeProcessId
                                            })
                                            processList = processList.filter(function(process) {
                                                return process.id !== freeProcessId
                                            })

                                            abortedProcess[0].status = 'aborted: out of memory'
                                            abortedProcessList = [...abortedProcessList, abortedProcess[0]]
                                            this.setState({
                                                processList,
                                                abortedProcessList
                                            })
                                            j = -1
                                        }
                                    } else {
                                        //add to aborted list
                                        let abortedProcess = processList.filter(function(process) {
                                            return process.id === freeProcessId
                                        })
                                        processList = processList.filter(function(process) {
                                            return process.id !== freeProcessId
                                        })
                                        
                                        abortedProcess[0].status = 'aborted: out of memory'
                                        abortedProcessList = [...abortedProcessList, abortedProcess[0]]
                                        this.setState({
                                            processList,
                                            abortedProcessList
                                        })
                                        j = -1
                                    }
                                }
                            }
                        }
                    }
                }
                this.setState({
                    coreList,
                    processList,
                    abortedProcessList
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
                            coreList[i].processInExecutionRemainingTime = -1
                            availableCores++
                            let currentBusyMemoryBlock = busyMemoryBlocks.find(function(block) {
                                return block.pid === currentProcess.id
                            })
                            freeMemoryBlocks = [...freeMemoryBlocks, {id: freeMemoryBlocks.length, size: currentBusyMemoryBlock.size, reqsize: 0, pid: null, type: 'free'}]
                            busyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
                                return block.pid !== currentProcess.id
                            })
                            memoryBlocksList = memoryBlocksList.filter(function(block) {
                                if (block.pid === currentProcess.id) {
                                    block.pid = null
                                    block.type = 'free'
                                    block.reqsize = currentBusyMemoryBlock.size
                                }
                                return block
                            })

                             // clean memory pages
                             for(let k = 0; k < memoryPageList.length; k++) {
                                for(let j = 0; j < memoryPageList[k].processList.length; j++) {
                                    if(memoryPageList[k].processList[j].processId === currentProcess.id) {
                                        memoryPageList[k].currentPageSize = memoryPageList[k].currentPageSize - memoryPageList[k].processList[j].requestSize
                                        memoryPageList[k].processList.splice(j, 1);
                                    }
                                }
                            }
                        }
                    }
                }

                this.setState({
                    freeMemoryBlocks,
                    busyMemoryBlocks,
                    memoryBlocksList,
                    memoryPageList
                })


                // Remove finished Processes
                let finishedProcessListId = []
                let currentFinishedProcesses = processList.filter(function(process) {
                    if (process.remainingExecutionTime === 0) {
                        finishedProcessListId.push(process.id)
                    }
                    return process.remainingExecutionTime === 0
                })

                if (finishedProcessListId.length) {
                    for(let i = 0; i < memoryPageList.length; i++) {
                        for(let j = 0; j < memoryPageList[i].processList.length; j++) {
                            if(finishedProcessListId.includes(memoryPageList[i].processList[j].processId)) {
                                debugger
                                memoryPageList[i].currentPageSize = memoryPageList[i].currentPageSize - memoryPageList[i].processList[j].requestSize
                                memoryPageList[i].processList.splice(j, 1);
                            }
                        }
                    }
                }

                currentFinishedProcesses = currentFinishedProcesses.map(function(process){
                    process.status = 'finished'
                    return process
                })

                Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)

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
                    coreList,
                    processList,
                    finishedProcessList
                })

                // Updates Executing Processes
                for (let i = 0; i < processList.length; i++) {
                    if(processList[i].status === 'executing') {
                        processList[i].remainingExecutionTime--

                        // checking for random requests
                        let requestRdm = randomIntFromInterval(1, 4);
                        if (requestRdm === 1) {
                            let request = {id: processList[i].id, bytes: randomIntFromInterval(32, 512)}

                            // Allocate request in best available block
                            if (initialMemoryAvailability > 0 && request.bytes <= initialMemoryAvailability) {
                                initialMemoryAvailability -= request.bytes
                                busyMemoryBlocks = [...busyMemoryBlocks, {id: busyMemoryBlocks.length, size: request.bytes, reqsize: request.bytes, pid: processList[i].id, type: 'busy'}]
                                memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]

                                if (memoryPageList.length) {
                                    this.addBlockToMemoryPage(request, memoryPageList, pageSize)
                                    debugger
                                }

                                this.setState({
                                    busyMemoryBlocks,
                                    memoryBlocksList,
                                    initialMemoryAvailability
                                })
                            }
                            else if (freeMemoryBlocks.length) {

                                // Find best available block
                                let minSizeRequest = request.bytes
                                let minSize
                                let minSizeBlock
                                for (let k = 0; k < freeMemoryBlocks.length; k++) {
                                    if(minSizeRequest <= freeMemoryBlocks[k].size) {
                                        let aux = freeMemoryBlocks[k].size - minSizeRequest
                                        if (aux < minSize) {
                                            minSize = aux
                                            minSizeBlock = freeMemoryBlocks[k]
                                        }
                                    }
                                }
                                if (minSizeBlock) {
                                    if(processList[i].id >= 0) {
                                        minSizeBlock.pid = processList[i].id
                                        minSizeBlock.type = 'busy'
                                        minSizeBlock.reqsize = processList[i].bytes
                                        busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]
                                        // eslint-disable-next-line
                                        freeMemoryBlocks = freeMemoryBlocks.filter(function(block) {
                                            return block.id !== minSizeBlock.id
                                        })
                                        memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]

                                        if (memoryPageList.length) {
                                            this.addBlockToMemoryPage(request, memoryPageList, pageSize)
                                            debugger
                                        }

                                        this.setState({
                                            freeMemoryBlocks,
                                            busyMemoryBlocks,
                                            memoryBlocksList
                                        })
                                    }
                                }
                            } else {
                                // abort process
                                // free all busy blocks and core for that process
                                let newFreeMemoryBlocks = []

                                // eslint-disable-next-line
                                let cleanBusyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
                                    if (block.pid === processList[i].id) {
                                        newFreeMemoryBlocks.push({id: block.id, pid: null, reqsize: 0, size: block.size, type: "free"})
                                    }
                                    return block.pid !== processList[i].id
                                })

                                for (let k = 0; k < coreList.length; k++) {
                                    if (coreList[k].processInExecution.substring(1) === processList[i].id.toString()) {
                                        coreList[k].processInExecution = 'none'
                                        coreList[k].status = 'waiting for process'
                                        coreList[k].currentQuantum = this.state.quantum
                                        availableCores++
                                    }
                                }

                                // clean memory pages
                                for(let k = 0; k < memoryPageList.length; k++) {
                                    for(let j = 0; j < memoryPageList[k].processList.length; j++) {
                                        if(memoryPageList[k].processList[j].processId === processList[i].id) {
                                            memoryPageList[k].currentPageSize = memoryPageList[k].currentPageSize - memoryPageList[k].processList[j].requestSize
                                            memoryPageList[k].processList.splice(j, 1);
                                        }
                                    }
                                }

                                // eslint-disable-next-line
                                let cleanProcessList = processList.filter(function (process) {
                                    if (process.id === processList[i].id) {
                                        process.status = "aborted: out of memory"
                                        abortedProcessList = [...abortedProcessList, process]
                                    }
                                    return process.id !== processList[i].id
                                })

                                processList = cleanProcessList
                                freeMemoryBlocks = [...freeMemoryBlocks, ...newFreeMemoryBlocks]
                                busyMemoryBlocks = cleanBusyMemoryBlocks
                                memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]
                            }
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
                    coreList,
                    processList,
                    memoryBlocksList,
                    freeMemoryBlocks,
                    busyMemoryBlocks,
                    abortedProcessList
                })

                this.algorithmRoundRobinBestFit()
            } else {
                setTimeout(() => {
                    this.props.history.push('/')
                }, 10000)
            }
        }, 2000)
    }

    algorithmRoundRobinMergeFit() {
        setTimeout(() => {

            let coreList = [...this.state.coreList]
            let processList = [...this.state.processList]
            let freeMemoryBlocks = [...this.state.freeMemoryBlocks]
            let busyMemoryBlocks = [...this.state.busyMemoryBlocks]
            let memoryBlocksList = [...this.state.memoryBlocksList]
            let initialMemoryAvailability = this.state.initialMemoryAvailability
            let finishedProcessList = this.state.finishedProcessList
            let abortedProcessList = this.state.abortedProcessList

            let availableCores = getAvailableCoreAmmount(coreList)

            //Keep running until empty process list
            if (processList.length) {

                //Merge blocks
                if (memoryBlocksList.length) {
                    for (let k = 0 ; k < memoryBlocksList.length; k++) {
                        if (k === memoryBlocksList.length) {
                            break
                        }
                        if (k === memoryBlocksList.length - 1) {
                            if (memoryBlocksList[k].type === 'free' && initialMemoryAvailability > 0) { 
                                initialMemoryAvailability += memoryBlocksList[k].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    return block.id !== memoryBlocksList[k].id
                                })
                                break
                            }
                        }
                        if (memoryBlocksList[k].type === 'free') {
                            if (memoryBlocksList[k+1] && memoryBlocksList[k+1].type === "free") {
                                memoryBlocksList[k].size += memoryBlocksList[k+1].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.id === memoryBlocksList[k].id) {
                                        memoryBlocksList[k].reqsize = 0
                                    }
                                    return block.id !== memoryBlocksList[k+1].id
                                })
                            }
                            if (memoryBlocksList[k-1] && memoryBlocksList[k-1].type === "free") {
                                memoryBlocksList[k].size += memoryBlocksList[k-1].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.id === memoryBlocksList[k].id) {
                                        memoryBlocksList[k].reqsize = 0
                                    }
                                    return block.id !== memoryBlocksList[k-1].id
                                })
                            }
                        }
                    }
                }

                this.setState({
                    memoryBlocksList,
                    initialMemoryAvailability
                })
                // Allocating Process to Cores

                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'waiting for process' && availableCores > 0) {
                        for (let j = 0; j < processList.length; j++) {
                            if(processList[j].status === 'ready') {
                                let freeProcessId = processList[j].id

                                // Merge Fit

                                //Initial start case, no blocks free yet - Allocation
                                let busyBlock = busyMemoryBlocks.filter(function(block) {
                                    return block.pid === freeProcessId
                                })
                                if (initialMemoryAvailability > 0 && processList[j].bytes <= initialMemoryAvailability && busyBlock.length === 0) {
                                    initialMemoryAvailability -= processList[j].bytes
                                    busyMemoryBlocks = [...busyMemoryBlocks, {id: memoryBlocksList.length, size: processList[j].bytes, reqsize: processList[j].bytes, pid: freeProcessId, type: 'busy'}]
                                    memoryBlocksList = [...memoryBlocksList, {id: memoryBlocksList.length, size: processList[j].bytes, reqsize: processList[j].bytes, pid: freeProcessId, type: 'busy'}]
                                    this.startProcessExecution(freeProcessId, i, j)
                                    availableCores--
                                    this.setState({
                                        busyMemoryBlocks,
                                        memoryBlocksList,
                                        initialMemoryAvailability
                                    })
                                    break
                                }
                                //Already allocated blocks case
                                else {
                                    if (busyBlock.length){
                                        availableCores--
                                        this.startProcessExecution(freeProcessId, i, j)
                                        this.setState({
                                            coreList,
                                            processList,
                                            busyMemoryBlocks,
                                            memoryBlocksList,
                                            initialMemoryAvailability
                                        })
                                        break
                                    }
                                    if (freeMemoryBlocks.length) {
                                        let coreTracker = availableCores

                                        // Find best available block
                                        let minSize = processList[j].bytes + 1
                                        let minSizeBlock
                                        for (let k = 0; k < freeMemoryBlocks.length; k++) {
                                            if(processList[j].bytes <= freeMemoryBlocks[k].size) {
                                                let aux = freeMemoryBlocks[k].size - processList[j].bytes
                                                if (aux < minSize) {
                                                    minSize = aux
                                                    minSizeBlock = freeMemoryBlocks[k]
                                                }
                                            }
                                        }
                                        if (minSizeBlock) {
                                            if(freeProcessId >= 0) {
                                                minSizeBlock.pid = freeProcessId
                                                minSizeBlock.type = 'busy'
                                                minSizeBlock.reqsize = processList[j].bytes
                                                busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]
                                                // eslint-disable-next-line
                                                freeMemoryBlocks = freeMemoryBlocks.filter(function(block) {
                                                    return block.id !== minSizeBlock.id
                                                })

                                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                                    if (block.id === minSizeBlock.id) {
                                                        block.pid = freeProcessId
                                                        block.type = 'busy'
                                                        block.reqsize = processList[j].bytes
                                                    }
                                                    return block
                                                })
                                                processList[j].status = 'executing'
                                                coreList[i].processInExecution = 'P' + freeProcessId
                                                coreList[i].status = 'executing'
                                                coreList[i].quantum = this.state.quantum
                                                coreList[i].processInExecutionRemainingTime = processList[j].remainingExecutionTime
                                                availableCores--
                                                this.setState({
                                                    coreList,
                                                    processList,
                                                    freeMemoryBlocks,
                                                    busyMemoryBlocks,
                                                    memoryBlocksList
                                                })
                                            } else {
                                                coreList[i].processInExecution = 'none'
                                                coreList[i].status = 'waiting for process'
                                                coreList[i].quantum = this.state.quantum
                                                coreList[i].processInExecutionRemainingTime = -1
                                                availableCores++
                                            }
                                            break
                                        }
                                        if (coreTracker === availableCores) {
                                            //add to aborted list
                                            processList = processList.filter(function(process) {
                                                return process.id !== freeProcessId
                                            })

                                            let abortedProcess = processList.filter(function(process) {
                                                return process.id === freeProcessId
                                            })

                                            if (abortedProcess[0]) {
                                                abortedProcess[0].status = 'aborted: out of memory'
                                                abortedProcessList = [...abortedProcessList, abortedProcess[0]]
                                            }

                                            this.setState({
                                                processList
                                            })
                                            j = -1
                                        }
                                    } else {
                                        //add to aborted list
                                        let abortedProcess = processList.filter(function(process) {
                                            return process.id === freeProcessId
                                        })
                                        abortedProcess[0].status = 'aborted: out of memory'
                                        processList = processList.filter(function(process) {
                                            return process.id !== freeProcessId
                                        })

                                        abortedProcessList = [...abortedProcessList, abortedProcess[0]]
                                        this.setState({
                                            processList,
                                            coreList
                                        })
                                        j = -1
                                    }
                                }
                            }
                        }
                    }
                }
                this.setState({
                    coreList: coreList,
                    processList: processList,
                    abortedProcessList
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
                            coreList[i].processInExecutionRemainingTime = -1
                            availableCores++
                            let currentBusyMemoryBlock = busyMemoryBlocks.find(function(block) {
                                return block.pid === currentProcess.id
                            })
                            freeMemoryBlocks = [...freeMemoryBlocks, {id: freeMemoryBlocks.length, size: currentBusyMemoryBlock.size, reqsize: 0, pid: null, type: 'free'}]
                            busyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
                                return block.pid !== currentProcess.id
                            })
                            memoryBlocksList = memoryBlocksList.filter(function(block) {
                                if (block.pid === currentProcess.id) {
                                    block.pid = null
                                    block.type = 'free'
                                    block.reqsize = currentBusyMemoryBlock.size
                                }
                                return block
                            })
                        }
                    }
                }

                this.setState({
                    freeMemoryBlocks,
                    busyMemoryBlocks,
                    memoryBlocksList
                })

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
                    coreList,
                    processList,
                    finishedProcessList
                })

                // Updates Executing Processes
                for (let i = 0; i < processList.length; i++) {
                    if(processList[i].status === 'executing') {
                        processList[i].remainingExecutionTime--

                        // checking for random requests
                        let requestRdm = randomIntFromInterval(1, 4);
                        if (requestRdm === 1 || requestRdm === 2) {
                            let request = {pid: processList[i].id, size: randomIntFromInterval(32, 512)}

                            // Allocate request in best available block
                            if (initialMemoryAvailability > 0 && request.size <= initialMemoryAvailability) {
                                initialMemoryAvailability -= request.size
                                busyMemoryBlocks = [...busyMemoryBlocks, {id: memoryBlocksList.length, size: request.size, reqsize: request.size, pid: processList[i].id, type: 'busy'}]
                                memoryBlocksList = [...memoryBlocksList, {id: memoryBlocksList.length, size: request.size, reqsize: request.size, pid: processList[i].id, type: 'busy'}]
                                this.setState({
                                    busyMemoryBlocks,
                                    memoryBlocksList,
                                    initialMemoryAvailability
                                })
                            }
                            else if (freeMemoryBlocks.length) {

                                // Find best available block
                                let minSizeRequest = request.size
                                let minSize
                                let minSizeBlock
                                for (let k = 0; k < freeMemoryBlocks.length; k++) {
                                    if(minSizeRequest <= freeMemoryBlocks[k].size) {
                                        let aux = freeMemoryBlocks[k].size - minSizeRequest
                                        if (aux < minSize) {
                                            minSize = aux
                                            minSizeBlock = freeMemoryBlocks[k]
                                        }
                                    }
                                }
                                if (minSizeBlock) {
                                    if(processList[i].id >= 0) {
                                        minSizeBlock.pid = processList[i].id
                                        minSizeBlock.type = 'busy'
                                        minSizeBlock.reqsize = processList[i].bytes
                                        busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]
                                        // eslint-disable-next-line
                                        freeMemoryBlocks = freeMemoryBlocks.filter(function(block) {
                                            return block.id !== minSizeBlock.id
                                        })

                                        memoryBlocksList = memoryBlocksList.filter(function(block) {
                                            if (block.id === minSizeBlock.id) {
                                                block.pid = minSizeBlock.id
                                                block.type = 'busy'
                                                block.reqsize = minSizeBlock.bytes
                                            }
                                            return block
                                        })

                                        this.setState({
                                            freeMemoryBlocks,
                                            busyMemoryBlocks,
                                            memoryBlocksList
                                        })
                                    }
                                }
                            } else {
                                // abort process
                                // free all busy blocks and core for that process
                                let newFreeMemoryBlocks = []

                                // eslint-disable-next-line
                                let cleanBusyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
                                    if (block.pid === processList[i].id) {
                                        newFreeMemoryBlocks.push({id: block.id, pid: null, reqsize: 0, size: block.size, type: "free"})
                                    }
                                    return block.pid !== processList[i].id
                                })
                                for (let k = 0; k < coreList.length; k++) {
                                    let runningProcessId = coreList[k].processInExecution.substring(1)
                                    if (runningProcessId !== 'none'.substring(1)) {
                                        let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
                                        if (currentProcess.id === processList[i].id) {
                                            coreList[k].processInExecution = 'none'
                                            coreList[k].status = 'waiting for process'
                                            coreList[k].currentQuantum = this.state.quantum
                                            availableCores++
                                        }
                                    }
                                }

                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.pid === processList[i].id) {
                                        block.pid = null
                                        block.type = 'free'
                                        block.reqsize = processList[i].bytes
                                    }
                                    return block
                                })

                                // eslint-disable-next-line
                                let cleanProcessList = processList.filter(function (process) {
                                    if (process.id === processList[i].id) {
                                        process.status = "aborted: out of memory"
                                        abortedProcessList = [...abortedProcessList, process]
                                    }
                                    return process.id !== processList[i].id
                                })

                                processList = cleanProcessList
                                freeMemoryBlocks = [...freeMemoryBlocks, ...newFreeMemoryBlocks]
                                busyMemoryBlocks = cleanBusyMemoryBlocks
                            }
                        }
                    }
                }

                this.setState({
                    coreList,
                    processList,
                    memoryBlocksList,
                    freeMemoryBlocks,
                    busyMemoryBlocks,
                    abortedProcessList
                })

                // Updates Quantum on working Cores
                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
                        coreList[i].currentQuantum--
                        coreList[i].processInExecutionRemainingTime--
                    }
                }

                if (memoryBlocksList.length) {
                    for (let k = 0 ; k < memoryBlocksList.length; k++) {
                        if (k === memoryBlocksList.length) {
                            break
                        }
                        if (k === memoryBlocksList.length - 1) {
                            if (memoryBlocksList[k].type === 'free' && initialMemoryAvailability > 0) { 
                                initialMemoryAvailability += memoryBlocksList[k].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    return block.id !== memoryBlocksList[k].id
                                })
                                break
                            }
                        }
                        if (memoryBlocksList[k].type === 'free') {
                            if (memoryBlocksList[k+1] && memoryBlocksList[k+1].type === "free") {
                                memoryBlocksList[k].size += memoryBlocksList[k+1].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.id === memoryBlocksList[k].id) {
                                        memoryBlocksList[k].reqsize = 0
                                    }
                                    return block.id !== memoryBlocksList[k+1].id
                                })
                            }
                            if (memoryBlocksList[k-1] && memoryBlocksList[k-1].type === "free") {
                                memoryBlocksList[k].size += memoryBlocksList[k-1].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.id === memoryBlocksList[k].id) {
                                        memoryBlocksList[k].reqsize = 0
                                    }
                                    return block.id !== memoryBlocksList[k-1].id
                                })
                            }
                        }
                    }
                }

                this.setState({
                    coreList,
                    processList,
                    memoryBlocksList
                })
                this.algorithmRoundRobinMergeFit()
            } else {
                if (memoryBlocksList.length) {
                    for (let k = 0 ; k < memoryBlocksList.length; k++) {
                        if (k === memoryBlocksList.length) {
                            break
                        }
                        if (k === memoryBlocksList.length - 1) {
                            if (memoryBlocksList[k].type === 'free' && initialMemoryAvailability > 0) { 
                                initialMemoryAvailability += memoryBlocksList[k].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    return block.id !== memoryBlocksList[k].id
                                })
                                break
                            }
                        }
                        if (memoryBlocksList[k].type === 'free') {
                            if (memoryBlocksList[k+1] && memoryBlocksList[k+1].type === "free") {
                                memoryBlocksList[k].size += memoryBlocksList[k+1].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.id === memoryBlocksList[k].id) {
                                        memoryBlocksList[k].reqsize = 0
                                    }
                                    return block.id !== memoryBlocksList[k+1].id
                                })
                            }
                            if (memoryBlocksList[k-1] && memoryBlocksList[k-1].type === "free") {
                                memoryBlocksList[k].size += memoryBlocksList[k-1].size
                                memoryBlocksList = memoryBlocksList.filter(function(block) {
                                    if (block.id === memoryBlocksList[k].id) {
                                        memoryBlocksList[k].reqsize = 0
                                    }
                                    return block.id !== memoryBlocksList[k-1].id
                                })
                            }
                        }
                    }
                }
                this.setState({
                    initialMemoryAvailability,
                    memoryBlocksList
                })
                setTimeout(() => {
                    this.props.history.push('/')
                }, 10000)
            }
        }, 2000)
    }

    algorithmPriorityQueueRoundRobin() {
        setTimeout(() => {

            let coreList = [...this.state.coreList]
            let processListQ = this.state.processList
            let finishedProcessList = this.state.finishedProcessList

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

    handleClick = (e) => {
        // eslint-disable-next-line
        let totalExecutionTime = randomIntFromInterval(4, 20);
        let priority = randomIntFromInterval(0, 3);
        let bytesToExecute = randomIntFromInterval(32, 1024)
        let processList = this.state.processList
        if (this.state.algorithm !== 'priority-queue') {
            let id = Math.max.apply(Math, this.state.processList.map(function(process) { return process.id; }));
            let newProcess = {id: id + 1, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, inserted: true, bytes: bytesToExecute}
            processList = [...this.state.processList, newProcess]
            if (this.state.algorithm === 'sjf') {
                processList = sortList(processList, 'totalExecutionTime')
            }
            this.setState({
                processList: processList
            })
        } else {
            let maxId = getMaxIdFromProcessList(this.state.processList) + 1
            let newProcess = {id: maxId, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, inserted: true, bytes: bytesToExecute}
            processList[priority].push(newProcess)
            this.setState({
                processList: processList
            })
        }
    }

    startProcessExecution = (processID, coreListRef, processListRef) => {
        let coreList = [...this.state.coreList]
        let processList = [...this.state.processList]
        processList[processListRef].status = 'executing'
        coreList[coreListRef].processInExecution = 'P' + processID
        coreList[coreListRef].status = 'executing'
        coreList[coreListRef].quantum = this.state.quantum
        coreList[coreListRef].processInExecutionRemainingTime = processList[processListRef].remainingExecutionTime
        this.setState({
            coreList,
            processList
        })
    }

    addBlockToMemoryPage = (process, memoryPageList, pageSize) => {
        let addedToExistingPage = false
        for (let i=0; i < memoryPageList.length; i++) {
            if (memoryPageList[i].currentPageSize < pageSize && memoryPageList[i].currentPageSize + process.bytes <= pageSize) {
                memoryPageList[i].processList = [...memoryPageList[i].processList, {blockId: memoryPageList[i].processList.length, processId: process.id, size: process.bytes, requestSize: process.bytes}]
                memoryPageList[i].currentPageSize = memoryPageList[i].currentPageSize + process.bytes
                addedToExistingPage = true
                break
            }
        }
        if (!addedToExistingPage) {
            memoryPageList.push({id: memoryPageList.length, currentPageSize: process.bytes, processList: [{blockId: 0, processId: process.id, size:process.bytes, requestSize: process.bytes}]})
        }
        this.setState({
            memoryPageList
        })
    }

    getOccupiedPercentageInAllMemoryPages = () => {
        let memoryPageList = this.state.memoryPageList
        let currentOccupiedSpaceInAllMemoryPages = 0
        for (let i = 0; i < memoryPageList.length; i++) {
            currentOccupiedSpaceInAllMemoryPages += memoryPageList[i].currentPageSize
        }
        let percentage = (currentOccupiedSpaceInAllMemoryPages * 100) /  this.state.memorySize
        percentage = Math.round( percentage * 10 ) / 10;

        return percentage
    }

    render () {
        const {} = this.props.algorithmData
        return (
            <div>
                <div className="process-scheduler_info">
                    <div>
                        Running Algorithm: <span className="process-scheduler_info-algorithm">{this.state.algorithm}</span>
                    </div>
                    <div>
                        Page Size: <span className="process-scheduler_info-algorithm">{this.state.pageSize}</span>
                    </div>
                    <div>
                        Disk Size: <span className="process-scheduler_info-algorithm">{this.state.diskSize}</span>
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
                <div className="section-title">Core List</div>
                <Core cores={this.state.coreList} />

                <div className="section-title">Process List</div>
                {this.state.algorithm === 'priority-queue' ? <ProcessQueues processes={this.state.processList}/> : <Process processes={this.state.processList}/>}

                <div>
                    <div className="section-title">HD Pages - Size {this.state.diskSize} bytes - </div>
                    <Disk diskPages={this.state.diskPageList}/>
                </div>

                <div>
                    <div className="section-title">Memory Pages - Size {this.state.memorySize} bytes - Occupied Percentage {this.getOccupiedPercentageInAllMemoryPages()}%</div>
                    <MemoryPageList memoryPages={this.state.memoryPageList}/>
                </div>
                
                {
                    this.state.algorithmMemoryManager === 'bestFit' ? (
                        <div></div>
                    ) : (
                        <div>
                            <div className="section-title">Memory</div>
                            <div className={this.state.algorithm !== 'round-robin' ? "memory hide" : "memory" }>
                                <Memory memoryBlocks={this.state.memoryBlocksList.length ? this.state.memoryBlocksList : []} />
                                {this.state.initialMemoryAvailability > 0 ? <div className="memory-initial">{this.state.initialMemoryAvailability} bytes {this.state.algorithmMemoryManager === 'mergeFit' ? "super block":"not allocated"}</div> : <div className="hide"></div>}
                            </div>
                        </div>
                    )
                }

                <div>
                    <div className="section-title">Finished Process List</div>
                    <FinishedProcessList processes={this.state.finishedProcessList}/>
                </div>
                <div>
                    <div className="section-title">Aborted Process List</div>
                    <AbortedProcessList processes={this.state.abortedProcessList}/>
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

export default connect(mapStateToProps, mapDispatchToProps) (Scheduler)
