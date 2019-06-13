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
import { arePagesOnMemory, swapFromHDToRAM, getFreeMemoryAVailability, abortProcess, removeFinishedProcess, createInitialPagesList, swapFromRAMToHD, addBlockToMemoryPage, startProcessExecution, getProcessIdsInPage, getBestAvailableBlock, hasEnoughSpaceByMovingPagesToHD, getOccupiedPercentageInAllDiskPages, getOccupiedPercentageInAllMemoryPages, getRemovablePagesFromRAM, getFreeBlocksOnMemory, getProcessesIdsInExecution, getProcessPagesReferences, sortList, getAvailableCoreAmmount, randomIntFromInterval, getAvailableProcessAmmount, getAvailableCore, getMaxIdFromProcessList} from './HelperFunctions'
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
        if (this.state.algorithm === 'round-robin' && this.state.algorithmMemoryManager === 'bestFit') {
            this.state.memoryPageList = createInitialPagesList(this.state.memoryPageList, this.state.pageSize, this.state.memorySize)
            this.state.diskPageList = createInitialPagesList(this.state.diskPageList, this.state.pageSize, this.state.diskSize)
        }
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

            let { 
                coreList, processList,
                finishedProcessList, abortedProcessList, diskPageList,
                memoryPageList, pageSize, memorySize, quantum
            } = this.state

            let initialMemoryAvailability = getFreeMemoryAVailability(memoryPageList, memorySize)

            let availableCores = getAvailableCoreAmmount(coreList)

            //Keep running until empty process list
            if (processList.length) {
                for (let i = 0; i < coreList.length; i++) {
                    if(coreList[i].status === 'waiting for process' && availableCores > 0) {
                        for (let j = 0; j < this.getLength(this.state.processList); j++) {
                            if(processList[j].status === 'ready') {
                                
                                // BEST FIT

                                let currentProcess = processList[j]
                                diskPageList = this.state.diskPageList
                                memoryPageList = this.state.memoryPageList
                                processList = this.state.processList
                                abortedProcessList = this.state.abortedProcessList
                                let initialMemoryAvailability = getFreeMemoryAVailability(memoryPageList, memorySize)
                                let processesIdsInExecution = getProcessesIdsInExecution(processList)
                                processesIdsInExecution.push(currentProcess.id)
                                let removablePagesIdsFromRAM = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)
                                let processPagesReferences = getProcessPagesReferences(memoryPageList, diskPageList, currentProcess)
                                let enoughSpaceByMovingPagesToHD = hasEnoughSpaceByMovingPagesToHD(removablePagesIdsFromRAM, memoryPageList, initialMemoryAvailability, currentProcess.bytes)
                                let freeBlocksOnMemory = getFreeBlocksOnMemory(memoryPageList)
                                
                                //Initial start case, no blocks free yet
                                //Do we still have initial memory available and this process hasnt started yet? To make a block with the perfect size

                                if (currentProcess.bytes <= initialMemoryAvailability && processPagesReferences.length === 0) {
                                    [coreList, processList] = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)

                                    this.setState({coreList, processList})
                                    
                                    let bes = addBlockToMemoryPage(currentProcess, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                                    memoryPageList = bes[0]
                                    diskPageList = bes[1]
                                    initialMemoryAvailability = bes[2]
                                    this.setState({memoryPageList, diskPageList, initialMemoryAvailability})

                                    availableCores--
                                    break
                                }

                                //Process already allocated before? Lets move all of his pages to the RAM
                                else if (processPagesReferences.length) {
                                    let processPagesInHD = processPagesReferences.filter(function(reference) {
                                        return reference.pageLocation === 'disk'
                                    })

                                    if (processPagesInHD.length) {

                                        let removablePagesIdsFromRAM = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)
    
                                        let ammountOfBytesToBringFromHD = processPagesReferences.map(item => item.pageSize)
                                        .reduce((prev, curr) => prev + curr, 0)
    
                                        let enoughSpaceByMovingPagesToHD = hasEnoughSpaceByMovingPagesToHD(removablePagesIdsFromRAM, memoryPageList, initialMemoryAvailability, ammountOfBytesToBringFromHD)
    
                                        let processPagesInHDIds = processPagesInHD.map(item => item.pageReference)
    
                                        //Do we already have space
                                        if (ammountOfBytesToBringFromHD <= initialMemoryAvailability) {
                                            //just bring everything
                                            [memoryPageList, diskPageList, initialMemoryAvailability] = swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability)
                                            this.setState({memoryPageList, diskPageList, initialMemoryAvailability})
    
                                            availableCores--
    
                                            let res = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                            [ coreList, processList ] = res
                                            this.setState({coreList, processList})
                                        }
    
                                        //Can/Do we have to make space?
                                        //Temos paginas removiveis da RAM suficientes para trazer as paginas do HD?
                                        else if(enoughSpaceByMovingPagesToHD && removablePagesIdsFromRAM.length >= processPagesInHD.length) {
                                            [memoryPageList, diskPageList, initialMemoryAvailability] = swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability)
                                            [memoryPageList, diskPageList, initialMemoryAvailability] = swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability)
    
                                            this.setState({memoryPageList, diskPageList, initialMemoryAvailability})
    
                                            availableCores--
                                            let res = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                            [ coreList, processList ] = res
                                            this.setState({coreList, processList})
    
                                        }
    
                                        //abort process
                                        else {
                                            [ coreList, processList, memoryPageList, diskPageList, abortedProcessList ] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                            this.setState({coreList, processList, memoryPageList, diskPageList, abortedProcessList})
                                        }
                                    }
                                    else {
                                        let res = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                        [ coreList, processList ] = res
                                        this.setState({coreList, processList})
                                    }

                                    break
                                }

                                //can we move stuff to the HD to MAKE SPACE?
                                else if (enoughSpaceByMovingPagesToHD) {
                                    //get page with lower usage rate
                                    let swapRAM = swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability)
                                    [ memoryPageList, diskPageList, initialMemoryAvailability ] = swapRAM

                                    this.setState({
                                        diskPageList,
                                        memoryPageList,
                                        initialMemoryAvailability
                                    })

                                    let res = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                    [ coreList, processList ] = res
                                    this.setState({coreList, processList})

                                    availableCores--

                                    //create page list or add to existing page list
                                    let bes = addBlockToMemoryPage(currentProcess, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                                    [ memoryPageList, diskPageList, initialMemoryAvailability ] = bes
                                    this.setState({memoryPageList, diskPageList, initialMemoryAvailability})

                                    break
                                }

                                //Do we have freeblocks?
                                else if (freeBlocksOnMemory.length) {
                                    //find best block and allocate there
                                    let bestBlock = getBestAvailableBlock(freeBlocksOnMemory, currentProcess)
                                    if (bestBlock) {
                                        memoryPageList = memoryPageList.map(function(page) {
                                            if (page.id === bestBlock.memoryPageId) {
                                                page.blockList[bestBlock.blockIndex].currentRequestSize = currentProcess.bytes
                                                page.blockList[bestBlock.blockIndex].processId = currentProcess.id
                                                page.blockList[bestBlock.blockIndex].type = 'busy'
                                            }
                                            return page
                                        })
                                        this.setState({memoryPageList})
                                        let res = startProcessExecution(currentProcess, coreList, processList, i, j, quantum)
                                        [ coreList, processList ] = res
                                        this.setState({coreList, processList})

                                    } else {
                                        //abort process
                                        [ coreList, processList, memoryPageList, diskPageList, abortedProcessList ] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                        this.setState({coreList, processList, memoryPageList, diskPageList, abortedProcessList})

                                        j = -1
                                    }

                                    break
                                }

                                //Nothing else to do, abort the process
                                else {
                                    [ coreList, processList, memoryPageList, diskPageList, abortedProcessList ] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                    this.setState({coreList, processList, memoryPageList, diskPageList, abortedProcessList})

                                    j = -1
                                }
                            }
                        }
                    }
                }
                this.setState({
                    coreList,
                    abortedProcessList,
                    memoryPageList,
                    diskPageList
                })

                // Remove finished processes (Remaining Execution Time === 0)

                let removedFinishedProcess = removeFinishedProcess(coreList, processList, memoryPageList, finishedProcessList, quantum)
                if (removedFinishedProcess.length) {
                    [ coreList, processList, memoryPageList, finishedProcessList ] = removedFinishedProcess
                    this.setState({
                        coreList, processList, memoryPageList, finishedProcessList
                    })
                }
                

                // Remove process w/ core quantum === 0 but w/ Remaining Time to Execute > 0
                for (let i = 0; i < this.getLength(coreList); i++) {
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
                for (let i = 0; i < this.getLength(this.state.processList); i++) {
                    diskPageList = this.state.diskPageList
                    memoryPageList = this.state.memoryPageList
                    processList = this.state.processList
                    abortedProcessList = this.state.abortedProcessList
                    let initialMemoryAvailability = getFreeMemoryAVailability(memoryPageList, memorySize)

                    if(processList[i].status === 'executing') {
                        //check if all his pages are already on memory
                        
                        let currentProcess = processList[i]
                        let freeBlocksPagesReferences = getFreeBlocksOnMemory(memoryPageList)
                        let processesIdsInExecution = getProcessesIdsInExecution(processList)
                        let removablePagesIdsFromRAM = getRemovablePagesFromRAM(memoryPageList, processesIdsInExecution)
                        let pagesOnMemory = arePagesOnMemory(processList[i], diskPageList)
                        if (!pagesOnMemory) {
                            //bring his pages to memory
                            let processPagesReferences = getProcessPagesReferences(memoryPageList, diskPageList, currentProcess)
                            let processPagesInHD = processPagesReferences.filter(function(reference) {
                                return reference.pageLocation === 'disk'
                            })
                            if (processPagesInHD.length) {
                                let processPagesInHDIds = processPagesInHD.map(item => item.pageReference)
    
                                [memoryPageList, diskPageList, initialMemoryAvailability] = swapFromHDToRAM(memoryPageList, diskPageList, processPagesInHDIds, initialMemoryAvailability)
                                this.setState({memoryPageList, diskPageList, initialMemoryAvailability})
                            }
                        }

                        processList[i].remainingExecutionTime--

                        // checking for random requests
                        let requestRdm = randomIntFromInterval(1, 6);
                        if (requestRdm === 1) {
                            let request = {id: processList[i].id, bytes: randomIntFromInterval(32, 512)}
                            
                            let enoughSpaceByMovingPagesToHD = hasEnoughSpaceByMovingPagesToHD(removablePagesIdsFromRAM, memoryPageList, initialMemoryAvailability, request)
                            

                            // Allocate request in best available block
                            if (initialMemoryAvailability > 0 && request.bytes <= initialMemoryAvailability) {
                                [ memoryPageList, diskPageList, initialMemoryAvailability ] = addBlockToMemoryPage(request, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                                this.setState({memoryPageList, diskPageList, initialMemoryAvailability})
                            }

                            else if (enoughSpaceByMovingPagesToHD) {
                                //move pages to HD
                                let swapRAM = swapFromRAMToHD(memoryPageList, diskPageList, removablePagesIdsFromRAM, initialMemoryAvailability)
                                [ memoryPageList, diskPageList, initialMemoryAvailability ] = swapRAM

                                this.setState({
                                    memoryPageList,
                                    diskPageList,
                                    initialMemoryAvailability
                                })

                                [ memoryPageList, diskPageList, initialMemoryAvailability ] = addBlockToMemoryPage(request, initialMemoryAvailability, processList, memoryPageList, pageSize, diskPageList, memorySize)
                                this.setState({memoryPageList, diskPageList, initialMemoryAvailability})
                            }

                            // Find best free block
                            else if (freeBlocksPagesReferences.length) {
                                let bestBlock = getBestAvailableBlock(freeBlocksPagesReferences, request)
                                if (bestBlock) {
                                    memoryPageList = memoryPageList.map(function(page) {
                                        if (page.id === bestBlock.memoryPageId) {
                                            page.blockList[bestBlock.blockIndex].currentRequestSize = request.bytes
                                            page.blockList[bestBlock.blockIndex].processId = request.id
                                        }
                                        return page
                                    })
                                    this.setState({memoryPageList})
                                } else {
                                    [ coreList, processList, memoryPageList, diskPageList, abortedProcessList ] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                    this.setState({coreList, processList, memoryPageList, diskPageList, abortedProcessList})
                                }

                                break
                            }

                            else {
                                [ coreList, processList, memoryPageList, diskPageList, abortedProcessList ] = abortProcess(currentProcess, coreList, processList, memoryPageList, diskPageList, abortedProcessList, quantum)
                                this.setState({coreList, processList, memoryPageList, diskPageList, abortedProcessList})
                            }
                        }
                    }
                }

                this.updateQuantumOnWorkingCores()

                this.setState({
                    processList,
                    memoryPageList,
                    diskPageList,
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

    updateQuantumOnWorkingCores = () => {
        let coreList = this.state.coreList
        for (let i = 0; i < coreList.length; i++) {
            if(coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
                coreList[i].currentQuantum--
                coreList[i].processInExecutionRemainingTime--
            }
        }

        this.setState({coreList})
    }

    getLength = (list) => {
        return list.length
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
        const {diskSize, diskPageList, memoryPageList, memorySize} = this.state
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
                    <div className="section-title bold">Memory Pages - Size {this.state.memorySize} bytes - Occupied Percentage {getOccupiedPercentageInAllMemoryPages(memoryPageList, memorySize)}% - {getFreeMemoryAVailability(memoryPageList, memorySize)} bytes free</div>
                    <MemoryPageList memoryPages={this.state.memoryPageList}/>
                </div>

                <div>
                    <div className="section-title bold">HD Pages - Size {this.state.diskSize} bytes - Occupied Percentage {getOccupiedPercentageInAllDiskPages(diskPageList, diskSize)}%</div>
                    <Disk diskPages={this.state.diskPageList}/>
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
