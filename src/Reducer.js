import {handleActions} from 'redux-actions'
import Immutable from 'immutable'
import { receiveAlgorithmData } from './Actions'

const initialState = Immutable.fromJS({
    algorithmData: {
        algorithm: '',
        coreAmmount: 0,
        processAmmount: 0,
        quantum: false
    }
})

export default handleActions({
    [receiveAlgorithmData]: (state, {payload}) => state.mergeDeep(payload),
}, initialState)