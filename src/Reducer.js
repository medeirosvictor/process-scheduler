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
        lastPriorityAdded: -1
    }
})

//Action configuration
export default handleActions({
    [receiveAlgorithmData]: (state, {payload}) => state.mergeDeep(payload),
    [resetAlgorithmData]: (state) => initialState
}, initialState)