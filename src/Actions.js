import { createAction } from 'redux-actions'

//Action Creation is done here, the paramenter is a message which should basically inform what the action is doing
//to the Redux Store data
export const receiveAlgorithmData = createAction('receives algorithm data')

export const resetAlgorithmData = createAction('resets algorithm data')