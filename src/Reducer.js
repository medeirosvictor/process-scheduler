import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import { receiveAlgorithmData, resetAlgorithmData } from './Actions'

//Initial state for data inside the Redux Store - for before event executions
const initialState = Immutable.fromJS({
    algorithmData: {
        algorithm: '',
        coreList: [],
        processList: [],
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
        diskSize: 40960,
        pageSize: 1024
    }
})

//Action configuration
export default handleActions({
    [receiveAlgorithmData]: (state, {payload}) => state.mergeDeep(payload),
    [resetAlgorithmData]: (state) => initialState
}, initialState)