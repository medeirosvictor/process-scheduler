import {createGetSelector} from 'reselect-immutable-helpers'

export const getAlgorithmData = createGetSelector(({Reducer}) => Reducer, 'algorithmData')