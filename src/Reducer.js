import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import { receiveAlgorithmData, resetAlgorithmData, updateCoreProcessLists, updateProcessList } from './Actions'

//Initial state for data inside the Redux Store - for before event executions
const initialState = Immutable.fromJS({
    algorithmData: {
        algorithm: '',
        coreList: [],
        processList: [],
        finishedProcessList: [],
        abortedProcessList: [],
        quantum: false,
        lastPriorityAdded: -1,
        algorithmMemoryManager: '',
        freeMemoryBlocks: [],
        busyMemoryBlocks: [],
        memoryBlocksList: [],
        initialMemoryAvailability: 0,
        memorySize: 0,
        occupiedMemoryPercentage: 0,
        memoryPageList: [],
        diskPageList: [],
        diskSize: 20480,
        pageSize: 1024
    }
})

//Action configuration
export default handleActions({
    [receiveAlgorithmData]: (state, {payload}) => state.mergeDeep(payload),
    [resetAlgorithmData]: (state) => initialState,
    [updateCoreProcessLists] : (state, {payload}) => {
        const newState = state.setIn(["algorithmData", "coreList"], payload.coreList)
        .setIn(["algorithmData", "processList"], payload.processList)
        return newState.setIn(["algorithmData", "finishedProcessList"], payload.finishedProcessList)
    },
    [updateProcessList] : (state, {payload}) => {
        const newState = state.setIn(["algorithmData", "processList"], payload.processList)
        return newState
    }
}, initialState)