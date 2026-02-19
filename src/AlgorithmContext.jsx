import React, { createContext, Component } from 'react'

const AlgorithmContext = createContext()

const initialAlgorithmData = {
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
    diskSize: 10240,
    pageSize: 1024,
}

class AlgorithmProvider extends Component {
    state = { ...initialAlgorithmData }

    setAlgorithmData = (data) => {
        this.setState(prevState => ({ ...prevState, ...data }))
    }

    resetAlgorithmData = () => {
        this.setState({ ...initialAlgorithmData })
    }

    render() {
        return (
            <AlgorithmContext.Provider
                value={{
                    algorithmData: this.state,
                    setAlgorithmData: this.setAlgorithmData,
                    resetAlgorithmData: this.resetAlgorithmData,
                }}
            >
                {this.props.children}
            </AlgorithmContext.Provider>
        )
    }
}

export { AlgorithmContext, AlgorithmProvider }
