import React, { Component } from 'react'
import Process from './Process'
import ProcessQueues from './ProcessQueues'
import Core from './Core'
import FinishedProcessList from './FinishedProcessList'
import AbortedProcessList from './AbortedProcessList'
import { getAlgorithmData } from './Selector'
import { connect } from 'react-redux'
import { createPropsSelector } from 'reselect-immutable-helpers'
import { algorithmSJF } from './Algorithms/SJF'
import { algorithmPriorityQueueRoundRobin } from './Algorithms/RoundRobinWPriorityQueue'
import { handleAddRandomProcess, receiveAlgorithmData, updateCoreProcessLists, updateProcessList } from './Actions'
import { processExecutionPagesInHD, hasProcessAlreadyStarted, getFreeSuitableBlockFromPages, getPageSuitableForRemoval, freeCoreFromProcess, removeProcessFromPages, getProcessIdsInExecution, getFuturePercentage, sortList, getAvailableCoreAmmount, randomIntFromInterval, getAvailableProcessAmmount, getAvailableCore, getMaxIdFromProcessList, getOccupiedBytesInAllMemoryPages} from './HelperFunctions'
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
    }


    componentDidMount() { 
        let algorithm = this.state.algorithm
        if(algorithm === 'sjf') {
            this.props.algorithmSJF(this.props.algorithmData.coreList, this.props.algorithmData.processList, this.props.algorithmData.finishedProcessList, true)
        } else if(algorithm === 'round-robin') {
            if (this.state.algorithmMemoryManager === 'bestFit') {
                this.algorithmRoundRobinBestFit()
            } else {
                this.algorithmRoundRobinMergeFit()
            }
        } else if(algorithm === 'priority-queue') {
            this.props.algorithmPriorityQueueRoundRobin(this.props.algorithmData)
        }
    }

//     algorithmRoundRobinBestFit() {
//         setTimeout(() => {

//             let coreList = [...this.state.coreList]
//             let processList = [...this.state.processList]
//             let initialMemoryAvailability = this.state.initialMemoryAvailability
//             let finishedProcessList = this.state.finishedProcessList
//             let abortedProcessList = this.state.abortedProcessList
//             let diskPageList = this.state.diskPageList
//             let memoryPageList = this.state.memoryPageList
//             let pageSize = this.state.pageSize
//             let diskSize = this.state.diskSize
//             let memorySize = this.state.memorySize

//             let availableCores = getAvailableCoreAmmount(coreList)

//             //Keep running until empty process list
//             if (processList.length) {
//                 for (let i = 0; i < coreList.length; i++) {
//                     if(coreList[i].status === 'waiting for process' && availableCores > 0) {
//                         for (let j = 0; j < processList.length; j++) {
//                             if(processList[j].status === 'ready') {
//                                 let currentProcess = processList[j]

//                                 // Best Fit Memory Management and Virtual Memory (HD)

//                                 let processAlreadyStarted = hasProcessAlreadyStarted(memoryPageList, diskPageList, currentProcess)
//                                 let freeSuitableBlockReferences = getFreeSuitableBlockFromPages(memoryPageList, currentProcess.bytes)
//                                 let pageSuitableForRemovalReference = getPageSuitableForRemoval(memoryPageList, getProcessIdsInExecution(coreList))
//                                 let futurePercentage = getFuturePercentage(memoryPageList, currentProcess.bytes, memorySize)

//                                 //First check if it's the first time that process is coming here
//                                 //Also, check if we can add the process to a block with the same size, taking form the initial memory available
//                                 if (!processAlreadyStarted) {
//                                     //If its the first time executing a process
//                                     //Check if the process will fit
//                                     if (futurePercentage <= 100) {
//                                         //will if be over 80%?
//                                         if (futurePercentage > 80) {
//                                             //If its going over 80%, is there a page we can take to HD to make it less?
//                                             if (diskSize && pageSuitableForRemovalReference >= 0) {
//                                             }
//                                             //If we cant move it to the HD, lets cope with it for now and just put it to execute 
//                                             //Do we have available space on the initial memory?
//                                             if (currentProcess.bytes <= initialMemoryAvailability) {
//                                                 initialMemoryAvailability -= currentProcess.bytes
//                                                 this.startProcessExecution(currentProcess.id, i, j)
//                                                 availableCores--
//                                                 memoryPageList = this.addBlockToMemoryPage(currentProcess, memoryPageList, pageSize)
//                                             }

//                                             //Do we have available space on a freeblock?
//                                             else if (Object.keys(freeSuitableBlockReferences).length > 0) {
//                                                 memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].processId = currentProcess
//                                                 memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].currentRequestSize = currentProcess.bytes
//                                                 memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].type = 'busy'
//                                             }
//                                         }
//                                         else {
//                                             //If not over 80%, will it fit on the initial memory?
//                                             if (currentProcess.bytes <= initialMemoryAvailability) {
//                                                 initialMemoryAvailability -= currentProcess.bytes
//                                                 this.startProcessExecution(currentProcess.id, i, j)
//                                                 availableCores--
//                                                 memoryPageList = this.addBlockToMemoryPage(currentProcess, memoryPageList, pageSize)
//                                             }
//                                             //If not on the initial memory will it fit on a freeblock?
//                                             else if (Object.keys(freeSuitableBlockReferences).length > 0) {
//                                                 memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].processId = currentProcess
//                                                 memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].currentRequestSize = currentProcess.bytes
//                                                 memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].type = 'busy'
//                                             }
//                                         }
//                                     } else {
//                                         //The process is going over 100% of our RAM
//                                         //Can we move a page to the HD to make space?
//                                         if (diskSize && pageSuitableForRemovalReference >= 0) {
//                                         }
//                                         //If we cant move pages to the HD
//                                         //And the process is going over 100%
//                                         else {
//                                             //abort the process
//                                         }
//                                     }

//                                 }
//                                 else {
//                                     //If it's not the first time a process is coming through lets put him in execution mode
//                                     //Changing a Core attribute and Process attribute
//                                     //And fetching from the HD all of its pages
//                                     this.startProcessExecution(currentProcess.id, i, j)
//                                     availableCores--

//                                     //Do we have pages to get from the HD?
//                                     if (processExecutionPagesInHD(diskPageList, currentProcess)) {
//                                         //move them to the RAM if we cant abort the process
//                                     }
//                                 }

//                                 //Check if we can create a perfect block = initial available space still fitting
//                                 if (initialMemoryAvailability > 0 && currentProcess.bytes <= initialMemoryAvailability && busyBlock.length === 0) {
//                                     initialMemoryAvailability -= currentProcess.bytes
//                                     this.startProcessExecution(currentProcess.id, i, j)
//                                     availableCores--

//                                     let futurePercentage = getFuturePercentage(memoryPageList, currentProcess.bytes, this.state.memorySize)

//                                     if (futurePercentage > 80) {
//                                         let processIdsInExecution = getProcessIdsInExecution(coreList)

//                                         for (let q = 0; q < processList.length; q++) {
//                                             if (processList[q].status === 'ready') {
//                                                 processIdsInExecution.push(processList[q].id)
//                                                 break
//                                             }
//                                         }

//                                         //search pages that dont have the ids in execution
//                                         let processIdInPage = []
//                                         for(let k = 0; k < memoryPageList.length; k++) {
//                                             for(let j = 0; j < memoryPageList[k].processList.length; j++) {
//                                                 processIdInPage.push(memoryPageList[k].processList[j].processId)
//                                             }
//                                             let found = processIdsInExecution.some(id=> processIdInPage.includes(id))
//                                             if(!found) {
//                                                 initialMemoryAvailability += memoryPageList[k].currentPageSize
//                                                 diskPageList = [...diskPageList, memoryPageList[k]]
//                                                 memoryPageList.splice(k, 1);
//                                                 break
//                                             }
//                                             processIdInPage = []
//                                         }
//                                     }
//                                     //create page list or add to existing page list
//                                     memoryPageList = this.addBlockToMemoryPage(currentProcess, memoryPageList, pageSize)

//                                     this.setState({
//                                         busyMemoryBlocks,
//                                         memoryBlocksList,
//                                         initialMemoryAvailability,
//                                         diskPageList,
//                                         memoryPageList
//                                     })
//                                     break
//                                 }
                                
//                                 //Check if we can allocate in free blocks - check inside page
//                                 let freeSuitableBlockReferences = getFreeSuitableBlockFromPages(memoryPageList, currentProcess.bytes)
//                                 if (Object.keys(freeSuitableBlockReferences).length > 0) {
//                                     //allocate 
//                                     memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].processId = currentProcess
//                                     memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].currentRequestSize = currentProcess.bytes
//                                     memoryPageList[freeSuitableBlockReferences.pageRef].processList[freeSuitableBlockReferences.blockRef].type = 'busy'
//                                     this.setState({
//                                         memoryPageList
//                                     })
//                                     debugger
//                                 }
//                                 //No blocks allocated - No initiallly available space BUT we can send some stuff to the disk
//                                 //Already allocated blocks case
//                                 else if (diskSize && pageSuitableForRemovalReference >= 0) {
//                                     diskPageList = [...diskPageList, memoryPageList[pageSuitableForRemovalReference]]
//                                     memoryPageList.splice(pageSuitableForRemovalReference, 1)
//                                     memoryPageList =  this.addBlockToMemoryPage(currentProcess, memoryPageList, pageSize)
//                                     this.setState({
//                                         diskPageList,
//                                         memoryPageList
//                                     })
//                                     debugger
//                                     break
//                                 }
//                                 else {
//                                     if (busyBlock.length) {
                                        
//                                         //go through all HD pages, if there are pages to be getten
//                                         //try to move all to RAM replacing pages not used
//                                         if(diskPageList.length) {
//                                             let processIdsInExecution = getProcessIdsInExecution(coreList)
    
//                                             for(let disk = 0; disk < diskPageList; disk++) {
//                                                 let diskProcessIds = diskPageList[disk].processList.map(process => process.id)
//                                                 debugger
//                                                 if(diskProcessIds.includes(currentProcess.id)) {
//                                                     //found HD page with memory for entering process
//                                                     //check if we add directly to RAM
//                                                     if(diskPageList[disk].currentPageSize + getOccupiedBytesInAllMemoryPages(memoryPageList) <= this.state.memorySize) {
//                                                         //remove page from HD
//                                                         //add page to Memory
//                                                     } else {
//                                                         //check if we can remove any pages from RAM that would fit
//                                                         let memoryRemoved = false
//                                                         for (let memory = 0; memory < memoryPageList; memory++) {
//                                                             let memoryProcessIds = memoryPageList[memory].processList.map(process => process.id)
//                                                             if(!memoryProcessIds.includes(processIdsInExecution) && !memoryProcessIds.includes(currentProcess.id) 
//                                                             && getOccupiedBytesInAllMemoryPages(memoryPageList) - memoryPageList[memory].currentPageSize + diskPageList[disk].currentPageSize <= this.state.memorySize) {
//                                                                 //remove RAM PAGE
//                                                                 //move HD PAGE
//                                                                 memoryRemoved = true
//                                                                 break
//                                                             }
//                                                         }
//                                                         if (!memoryRemoved) {
//                                                             //abort process
//                                                             // clean memory pages
//                                                             memoryPageList = removeProcessFromPages(memoryPageList, currentProcess.id)

//                                                             // clean disk pages
//                                                             memoryPageList = removeProcessFromPages(diskPageList, currentProcess.id)

//                                                             debugger
//                                                             let newFreeMemoryBlocks = []

//                                                             // eslint-disable-next-line
//                                                             let cleanBusyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
//                                                                 if (block.pid === processList[i].id) {
//                                                                     newFreeMemoryBlocks.push({id: block.id, pid: null, reqsize: 0, size: block.size, type: "free"})
//                                                                 }
//                                                                 return block.pid !== processList[i].id
//                                                             })

//                                                             coreList = freeCoreFromProcess(coreList, processList[i].id, this.state.quantum)
                            
//                                                             // clean memory pages
//                                                             memoryPageList = removeProcessFromPages(memoryPageList, processList[i].id)
                            
//                                                             // eslint-disable-next-line
//                                                             let cleanProcessList = processList.filter(function (process) {
//                                                                 if (process.id === processList[i].id) {
//                                                                     process.status = "aborted: out of memory"
//                                                                     abortedProcessList = [...abortedProcessList, process]
//                                                                 }
//                                                                 return process.id !== processList[i].id
//                                                             })
                            
//                                                             processList = cleanProcessList
//                                                             freeMemoryBlocks = [...freeMemoryBlocks, ...newFreeMemoryBlocks]
//                                                             busyMemoryBlocks = cleanBusyMemoryBlocks
//                                                             memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]

//                                                         }
//                                                     }
//                                                 }
//                                             }

//                                         }

//                                         availableCores--
//                                         this.startProcessExecution(currentProcess.id, i, j)

//                                         this.setState({
//                                             coreList,
//                                             processList,
//                                             busyMemoryBlocks,
//                                             memoryBlocksList,
//                                             initialMemoryAvailability
//                                         })
//                                         break
//                                     }
//                                     if (freeMemoryBlocks.length) {
//                                         let coreTracker = availableCores

//                                         // Find best available block
//                                         let minSize = currentProcess.bytes + 1
//                                         let minSizeBlock
//                                         for (let k = 0; k < freeMemoryBlocks.length; k++) {
//                                             if(processList[j].bytes <= freeMemoryBlocks[k].size) {
//                                                 let aux = freeMemoryBlocks[k].size - processList[j].bytes
//                                                 if (aux < minSize) {
//                                                     minSize = aux
//                                                     minSizeBlock = freeMemoryBlocks[k]
//                                                 }
//                                             }
//                                         }
//                                         if (minSizeBlock) {
//                                             if(currentProcess.id >= 0) {
//                                                 minSizeBlock.pid = currentProcess.id
//                                                 minSizeBlock.type = 'busy'
//                                                 minSizeBlock.reqsize = processList[j].bytes
//                                                 busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]

//                                                 // eslint-disable-next-line
//                                                 freeMemoryBlocks = freeMemoryBlocks.filter(function(block) {
//                                                     return block.id !== minSizeBlock.id
//                                                 })

//                                                 // eslint-disable-next-line
//                                                 memoryBlocksList = memoryBlocksList.filter(function(block) {
//                                                     if (block.id === minSizeBlock.id) {
//                                                         block.pid = currentProcess.id
//                                                         block.type = 'busy'
//                                                         block.reqsize = processList[j].bytes
//                                                     }
//                                                     return block
//                                                 })
//                                                 processList[j].status = 'executing'
//                                                 coreList[i].processInExecution = 'P' + currentProcess.id
//                                                 coreList[i].status = 'executing'
//                                                 coreList[i].quantum = this.state.quantum
//                                                 coreList[i].processInExecutionRemainingTime = processList[j].remainingExecutionTime
//                                                 availableCores--

//                                                 let futurePercentage = getFuturePercentage(memoryPageList, processList[j].bytes, this.state.memorySize)
//                                                 if (futurePercentage > 80) {
//                                                     //move stuff to disk and check for LFU
//                                                     let processIdsInExecution = getProcessIdsInExecution(coreList)

//                                                     for (let q = 0; q < processList.length; q++) {
//                                                         if (processList[q].status === 'ready') {
//                                                             processIdsInExecution.push(processList[q].id)
//                                                             break
//                                                         }
//                                                     }

//                                                     //search pages that dont have the ids in execution
//                                                     let movedPageToHD = false
//                                                     for(let k = 0; k < memoryPageList.length; k++) {
//                                                         if (!movedPageToHD) {
//                                                             for(let j = 0; j < memoryPageList[k].processList.length; j++) {
//                                                                 if(!processIdsInExecution.includes(memoryPageList[k].processList[j].processId) && memoryPageList[k].processList[j].processId !== processIdsInExecution[processIdsInExecution.length-1]) {
//                                                                     //move page to HD
//                                                                     diskPageList = [...diskPageList, memoryPageList[k]]
//                                                                     //remove page from memory
//                                                                     memoryPageList.splice(k, 1); 
//                                                                     movedPageToHD = true
//                                                                     break
//                                                                 }
//                                                             }
//                                                         }
//                                                     }
//                                                 }
//                                                 memoryPageList =  this.addBlockToMemoryPage(processList[j], memoryPageList, pageSize)

//                                                 this.setState({
//                                                     coreList,
//                                                     processList,
//                                                     freeMemoryBlocks,
//                                                     busyMemoryBlocks,
//                                                     memoryBlocksList,
//                                                     memoryPageList
//                                                 })
//                                             } else {
//                                                 coreList[i].processInExecution = 'none'
//                                                 coreList[i].status = 'waiting for process'
//                                                 coreList[i].quantum = this.state.quantum
//                                                 coreList[i].processInExecutionRemainingTime = -1
//                                                 availableCores++
//                                             }
//                                             break
//                                         }
//                                         if (coreTracker === availableCores) {
//                                             //add to aborted list
//                                             let abortedProcess = processList.filter(function(process) {
//                                                 return process.id === currentProcess.id
//                                             })
//                                             processList = processList.filter(function(process) {
//                                                 return process.id !== currentProcess.id
//                                             })

//                                             abortedProcess[0].status = 'aborted: out of memory'
//                                             abortedProcessList = [...abortedProcessList, abortedProcess[0]]
//                                             this.setState({
//                                                 processList,
//                                                 abortedProcessList
//                                             })
//                                             j = -1
//                                         }
//                                     } else {
//                                         //add to aborted list
//                                         let abortedProcess = processList.filter(function(process) {
//                                             return process.id === currentProcess.id
//                                         })
//                                         processList = processList.filter(function(process) {
//                                             return process.id !== currentProcess.id
//                                         })
                                        
//                                         abortedProcess[0].status = 'aborted: out of memory'
//                                         abortedProcessList = [...abortedProcessList, abortedProcess[0]]
//                                         this.setState({
//                                             processList,
//                                             abortedProcessList
//                                         })
//                                         j = -1
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 }
//                 this.setState({
//                     coreList,
//                     processList,
//                     abortedProcessList
//                 })

//                 // Remove finished processes (Remaining Execution Time === 0)
//                 for (let i = 0; i < coreList.length; i++) {
//                     let runningProcessId = coreList[i].processInExecution.substring(1)
//                     if (runningProcessId !== 'none'.substring(1)) {
//                         let currentProcess = processList.find(process => process.id.toString() === runningProcessId)
//                         if(currentProcess.remainingExecutionTime === 0) {
//                             coreList[i].processInExecution = 'none'
//                             coreList[i].status = 'waiting for process'
//                             coreList[i].currentQuantum = this.state.quantum
//                             coreList[i].processInExecutionRemainingTime = -1
//                             availableCores++
//                             let currentBusyMemoryBlock = busyMemoryBlocks.find(function(block) {
//                                 return block.pid === currentProcess.id
//                             })
//                             freeMemoryBlocks = [...freeMemoryBlocks, {id: freeMemoryBlocks.length, size: currentBusyMemoryBlock.size, reqsize: 0, pid: null, type: 'free'}]
//                             busyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
//                                 return block.pid !== currentProcess.id
//                             })
//                             memoryBlocksList = memoryBlocksList.filter(function(block) {
//                                 if (block.pid === currentProcess.id) {
//                                     block.pid = null
//                                     block.type = 'free'
//                                     block.reqsize = currentBusyMemoryBlock.size
//                                 }
//                                 return block
//                             })

//                              // clean memory pages
//                              memoryPageList = removeProcessFromPages(memoryPageList, currentProcess.id)
//                         }
//                     }
//                 }

//                 this.setState({
//                     freeMemoryBlocks,
//                     busyMemoryBlocks,
//                     memoryBlocksList,
//                     memoryPageList
//                 })


//                 // Remove finished Processes
//                 let finishedProcessListId = []
//                 let currentFinishedProcesses = processList.filter(function(process) {
//                     if (process.remainingExecutionTime === 0) {
//                         finishedProcessListId.push(process.id)
//                     }
//                     return process.remainingExecutionTime === 0
//                 })

//                 if (finishedProcessListId.length) {
//                     for(let i = 0; i < memoryPageList.length; i++) {
//                         for(let j = 0; j < memoryPageList[i].processList.length; j++) {
//                             if(finishedProcessListId.includes(memoryPageList[i].processList[j].processId)) {
//                                 memoryPageList[i].currentPageSize = memoryPageList[i].currentPageSize - memoryPageList[i].processList[j].requestSize
//                                 memoryPageList[i].processList.splice(j, 1);
//                             }
//                         }
//                     }
//                 }

//                 currentFinishedProcesses = currentFinishedProcesses.map(function(process){
//                     process.status = 'finished'
//                     return process
//                 })

//                 Array.prototype.push.apply(finishedProcessList, currentFinishedProcesses)

//                 processList = processList.filter(function(process) {
//                     return process.remainingExecutionTime > 0
//                 })

//                 // Remove process w/ core quantum === 0 but w/ Remaining Time to Execute > 0
//                 for (let i = 0; i < coreList.length; i++) {
//                     let runningProcessId = coreList[i].processInExecution.substring(1)
//                     let notFinishedProcess = processList.find(process => process.id.toString() === runningProcessId)
//                     if(coreList[i].currentQuantum === 0 && notFinishedProcess.remainingExecutionTime > 0) {
//                         coreList[i].processInExecution = 'none'
//                         coreList[i].status = 'waiting for process'
//                         coreList[i].currentQuantum = this.state.quantum
//                         availableCores++
//                         processList = processList.filter(function(process) {
//                             return process.id.toString() !== runningProcessId
//                         }) 
//                         notFinishedProcess.status = 'ready'
//                         processList = [...processList, notFinishedProcess]
//                     }
//                 }
//                 this.setState({
//                     coreList,
//                     processList,
//                     finishedProcessList
//                 })

//                 // Updates Executing Processes
//                 for (let i = 0; i < processList.length; i++) {
//                     if(processList[i].status === 'executing') {
//                         processList[i].remainingExecutionTime--

//                         // checking for random requests
//                         let requestRdm = randomIntFromInterval(1, 4);
//                         if (requestRdm === 1) {
//                             let request = {id: processList[i].id, bytes: randomIntFromInterval(32, 512)}

//                             // Allocate request in best available block
//                             if (initialMemoryAvailability > 0 && request.bytes <= initialMemoryAvailability) {
//                                 initialMemoryAvailability -= request.bytes
//                                 busyMemoryBlocks = [...busyMemoryBlocks, {id: memoryBlocksList[memoryBlocksList.length-1].id + 1 || memoryBlocksList.length, size: request.bytes, reqsize: request.bytes, pid: processList[i].id, type: 'busy'}]
//                                 memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]

//                                 if (memoryPageList.length) {
//                                     //before add check if it's going to need moving things to HD
//                                     let futurePercentage = getFuturePercentage(memoryPageList, request.bytes, this.state.memorySize)
//                                     if (futurePercentage > 80) {
//                                         //move stuff to disk and check for LFU
//                                         let processIdsInExecution = getProcessIdsInExecution(coreList)
//                                         let processIdInPage = []

//                                         for (let q = 0; q < processList.length; q++) {
//                                             if (processList[q].status === 'ready') {
//                                                 processIdsInExecution.push(processList[q].id)
//                                                 break
//                                             }
//                                         }

//                                         //search pages that dont have the ids in execution
//                                         for(let k = 0; k < memoryPageList.length; k++) {
//                                             for(let j = 0; j < memoryPageList[k].processList.length; j++) {
//                                                 processIdInPage.push(memoryPageList[k].processList[j].processId)
//                                             }
//                                             let found = processIdsInExecution.some(id=> processIdInPage.includes(id))
//                                             if(!found) {
//                                                 //move page to HD
//                                                 diskPageList = [...diskPageList, memoryPageList[k]]
//                                                 //remove page from memory
//                                                 memoryPageList.splice(k, 1); 
//                                             }
//                                         }
//                                     }
// debugger
//                                     memoryPageList =  this.addBlockToMemoryPage(request, memoryPageList, pageSize)
//                                 }

//                                 this.setState({
//                                     busyMemoryBlocks,
//                                     memoryBlocksList,
//                                     initialMemoryAvailability,
//                                     diskPageList,
//                                     memoryPageList
//                                 })
//                             }
//                             else if (freeMemoryBlocks.length) {

//                                 // Find best available block
//                                 let minSizeRequest = request.bytes
//                                 let minSize
//                                 let minSizeBlock
//                                 for (let k = 0; k < freeMemoryBlocks.length; k++) {
//                                     if(minSizeRequest <= freeMemoryBlocks[k].size) {
//                                         let aux = freeMemoryBlocks[k].size - minSizeRequest
//                                         if (aux < minSize) {
//                                             minSize = aux
//                                             minSizeBlock = freeMemoryBlocks[k]
//                                         }
//                                     }
//                                 }
//                                 if (minSizeBlock) {
//                                     if(processList[i].id >= 0) {
//                                         minSizeBlock.pid = processList[i].id
//                                         minSizeBlock.type = 'busy'
//                                         minSizeBlock.reqsize = processList[i].bytes
//                                         busyMemoryBlocks = [...busyMemoryBlocks, minSizeBlock]
//                                         // eslint-disable-next-line
//                                         freeMemoryBlocks = freeMemoryBlocks.filter(function(block) {
//                                             return block.id !== minSizeBlock.id
//                                         })
//                                         memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]

//                                         let futurePercentage = getFuturePercentage(memoryPageList, request.bytes, this.state.memorySize)

//                                         if (futurePercentage > 80) {
//                                             //move stuff to disk and check for LFU
//                                             let processIdsInExecution = getProcessIdsInExecution(coreList)
//                                             let processIdInPage = []

//                                             for (let q = 0; q < processList.length; q++) {
//                                                 if (processList[q].status === 'ready') {
//                                                     processIdsInExecution.push(processList[q].id)
//                                                     break
//                                                 }
//                                             }

//                                             //search pages that dont have the ids in execution
//                                             for(let k = 0; k < memoryPageList.length; k++) {
//                                                 for(let j = 0; j < memoryPageList[k].processList.length; j++) {
//                                                     processIdInPage.push(memoryPageList[k].processList[j].processId)
//                                                 }
//                                                 let found = processIdsInExecution.some(id=> processIdInPage.includes(id))
//                                                 if(!found) {
//                                                     //move page to HD
//                                                     diskPageList = [...diskPageList, memoryPageList[k]]
//                                                     //remove page from memory
//                                                     memoryPageList.splice(k, 1); 
//                                                 }
//                                             }
//                                         }
//                                         memoryPageList = this.addBlockToMemoryPage(request, memoryPageList, pageSize)


//                                         this.setState({
//                                             freeMemoryBlocks,
//                                             busyMemoryBlocks,
//                                             memoryBlocksList,
//                                             memoryPageList
//                                         })
//                                     }
//                                 }
//                             } else {
//                                 // abort process
//                                 // free all busy blocks and core for that process
//                                 let newFreeMemoryBlocks = []

//                                 // eslint-disable-next-line
//                                 let cleanBusyMemoryBlocks = busyMemoryBlocks.filter(function(block) {
//                                     if (block.pid === processList[i].id) {
//                                         newFreeMemoryBlocks.push({id: block.id, pid: null, reqsize: 0, size: block.size, type: "free"})
//                                     }
//                                     return block.pid !== processList[i].id
//                                 })

//                                 coreList = freeCoreFromProcess(coreList, processList[i].id, this.state.quantum)
//                                 availableCores++

//                                 // clean memory pages
//                                 memoryPageList = removeProcessFromPages(memoryPageList, processList[i].id)

//                                 // eslint-disable-next-line
//                                 let cleanProcessList = processList.filter(function (process) {
//                                     if (process.id === processList[i].id) {
//                                         process.status = "aborted: out of memory"
//                                         abortedProcessList = [...abortedProcessList, process]
//                                     }
//                                     return process.id !== processList[i].id
//                                 })

//                                 processList = cleanProcessList
//                                 freeMemoryBlocks = [...freeMemoryBlocks, ...newFreeMemoryBlocks]
//                                 busyMemoryBlocks = cleanBusyMemoryBlocks
//                                 memoryBlocksList = [...busyMemoryBlocks, ...freeMemoryBlocks]
//                             }
//                         }
//                     }
//                 }

//                 // Updates Quantum on working Cores
//                 for (let i = 0; i < coreList.length; i++) {
//                     if(coreList[i].status === 'executing' && coreList[i].currentQuantum > 0) {
//                         coreList[i].currentQuantum--
//                         coreList[i].processInExecutionRemainingTime--
//                     }
//                 }

//                 this.setState({
//                     coreList,
//                     processList,
//                     memoryBlocksList,
//                     freeMemoryBlocks,
//                     busyMemoryBlocks,
//                     abortedProcessList
//                 })

//                 this.algorithmRoundRobinBestFit()
//             } else {
//                 setTimeout(() => {
//                     this.props.history.push('/')
//                 }, 10000)
//             }
//         }, 2000)
//     }

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

    handleClick = (e) => {
        // eslint-disable-next-line
        let totalExecutionTime = randomIntFromInterval(4, 20);
        let priority = randomIntFromInterval(0, 3);
        let bytesToExecute = randomIntFromInterval(32, 1024)
        let processList = this.state.processList
        if (this.state.algorithm !== 'priority-queue') {
            let id = Math.max.apply(Math, this.state.processList.map(function(process) { return process.id; }));
            let newProcess = {name: "P"+(id+1), id: id + 1, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, inserted: true, bytes: bytesToExecute}
            processList = [...this.state.processList, newProcess]
            if (this.state.algorithm === 'sjf') {
                processList = sortList(processList, 'totalExecutionTime')
            }
            this.props.updateProcessList({processList})
            this.setState({
                processList
            })
        } else {
            let maxId = getMaxIdFromProcessList(this.state.processList) + 1
            let newProcess = {id: maxId, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, inserted: true, bytes: bytesToExecute}
            processList[priority].push(newProcess)
            this.setState({
                processList
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
                memoryPageList[i].processList = [...memoryPageList[i].processList, {processId: process.id, requestSize: process.bytes, type: 'busy', currentRequestSize: process.bytes}]
                memoryPageList[i].currentPageSize = memoryPageList[i].currentPageSize + process.bytes
                addedToExistingPage = true
                break
            }
        }
        if (!addedToExistingPage) {
            if(memoryPageList.length) {
                memoryPageList.push({id: memoryPageList[memoryPageList.length-1].id + 1, currentPageSize: process.bytes, processList: [{processId: process.id, requestSize: process.bytes, type: 'busy', currentRequestSize: process.bytes}]})
            } else {
                memoryPageList.push({id: memoryPageList.length, currentPageSize: process.bytes, processList: [{processId: process.id, requestSize: process.bytes, type: 'busy', currentRequestSize: process.bytes}]})
            }
        }

        return memoryPageList
    }

    getOccupiedPercentageInAllMemoryPages = () => {
        let currentOccupiedBytesInAllMemoryPages = getOccupiedBytesInAllMemoryPages(this.state.memoryPageList)
        let percentage = (currentOccupiedBytesInAllMemoryPages * 100) /  this.state.memorySize
        percentage = Math.round( percentage * 10 ) / 10;

        return percentage
    }

    getOccupiedBytesInAllDiskPages = () => {
        let diskPageList = this.state.diskPageList
        let currentOccupiedBytesInAllDiskPages = 0
        for (let i = 0; i < diskPageList.length; i++) {
            currentOccupiedBytesInAllDiskPages += diskPageList[i].currentPageSize
        }

        return currentOccupiedBytesInAllDiskPages
    }

    getOccupiedPercentageInAllDiskPages = () => {
        let currentOccupiedBytesInAllDiskPages = this.getOccupiedBytesInAllDiskPages()
        let percentage = (currentOccupiedBytesInAllDiskPages * 100) /  this.state.diskSize
        percentage = Math.round( percentage * 10 ) / 10;

        return percentage
    }

    render () {
        const {algorithm, coreList, processList, quantum, pageSize, diskSize, memoryPageList, 
            diskPageList, memorySize, memoryBlocksList, initialMemoryAvailability, algorithmMemoryManager, 
            finishedProcessList, abortedProcessList} = this.props.algorithmData

        const isBestFit = algorithmMemoryManager
        const isSJF = algorithm

        return (
            <div>
                <div className="process-scheduler_info">
                    <div>
                        Running Algorithm: <span className="process-scheduler_info-algorithm">{algorithm}</span>
                    </div>
                    <div>
                        Page Size: <span className="process-scheduler_info-algorithm">{pageSize}</span>
                    </div>
                    <div>
                        Disk Size: <span className="process-scheduler_info-algorithm">{diskSize}</span>
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
                    {algorithm === 'priority-queue' ? <div>Priorities and Quantums(Q) = (0 = 4 * Q, 1 =  3*Q, 2 = 2*Q, 3 = Q)<div>Quantum Submited (Initial Q) = {quantum}s</div></div> : <div></div>}
                    {isSJF === 'sjf' ? (
                        <button className="add-process-button" onClick={this.handleClick}>Add Random Process</button>
                        // <button className="add-process-button" onClick={handleAddRandomProcess}>Add Random Process</button>
                    ) : (
                        <button className="add-process-button" onClick={this.handleClick}>Add Random Process</button>
                    )}
                </div>
                <div className="section-title">Core List</div>
                <Core cores={coreList} />

                <div className="section-title">Process List</div>
                {algorithm === 'priority-queue' ? <ProcessQueues processes={processList}/> : <Process processes={processList}/>}

                {isBestFit === 'bestFit' ? (
                    <div>
                        <div className="section-title">HD Pages - Size {diskSize} bytes - Occupied {this.getOccupiedBytesInAllDiskPages()} bytes (Percentage {this.getOccupiedPercentageInAllDiskPages()}%)</div>
                        <Disk diskPages={diskPageList}/>
                    </div>
                ) : (
                    <div></div>
                )}

                {isBestFit === 'bestFit' ? (
                    <div>
                        <div className="section-title">Memory Pages - Size {memorySize} bytes - Occupied {getOccupiedBytesInAllMemoryPages(memoryPageList)} bytes (Percentage {this.getOccupiedPercentageInAllMemoryPages()}%)</div>
                        <MemoryPageList memoryPages={memoryPageList}/>
                    </div>
                ) : (
                    <div></div>
                )}
                
                {isBestFit === 'bestFit' ? (
                    <div>
                        <div className="section-title">Memory</div>
                        <div className={algorithm !== 'round-robin' ? "memory hide" : "memory" }>
                            <Memory memoryBlocks={memoryBlocksList.length ? memoryBlocksList : []} />
                            {initialMemoryAvailability > 0 ? <div className="memory-initial">{initialMemoryAvailability} bytes {algorithmMemoryManager === 'mergeFit' ? "super block":"not allocated"}</div> : <div className="hide"></div>}
                        </div>
                    </div>
                ) : (
                    <div></div>
                )}

                <div>
                    <div className="section-title">Finished Process List</div>
                    <FinishedProcessList processes={finishedProcessList}/>
                </div>
                <div>
                    <div className="section-title">Aborted Process List</div>
                    <AbortedProcessList processes={abortedProcessList}/>
                </div>
            </div>
        )
    }
}

const mapDispatchToProps = {
    receiveAlgorithmData,
    updateProcessList,
    algorithmSJF,
    algorithmPriorityQueueRoundRobin
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData,
})

export default connect(mapStateToProps, mapDispatchToProps) (Scheduler)
