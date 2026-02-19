import React, { Component } from 'react'
import { AlgorithmContext } from './AlgorithmContext'
import { randomIntFromInterval, sortPriorityQueues } from './HelperFunctions'

class AlgorithmSelector extends Component {
    static contextType = AlgorithmContext

    constructor(props, context) {
        super(props, context)
        this.state = {
            algorithm: '',
            coreAmmount: 0,
            processAmmount: 0,
            quantum: -1,
            algorithmMemoryManager: '',
            freeMemoryBlocks: [],
        }

        context.resetAlgorithmData()
    }

    handleChange = (e) => {
        const { setAlgorithmData } = this.context

        if (e.target.name === 'algorithm') {
            setAlgorithmData({ algorithm: e.target.value })
            this.setState({ algorithm: e.target.value })
        } else if (e.target.name === 'quantum') {
            setAlgorithmData({ quantum: Number.parseInt(e.target.value) })
            this.setState({ [e.target.id]: e.target.value })
        } else if (e.target.name === 'algorithmMemoryManager') {
            setAlgorithmData({ algorithmMemoryManager: e.target.value })
            this.setState({ algorithmMemoryManager: e.target.value })
        } else {
            setAlgorithmData({ [e.target.id]: e.target.value })
            this.setState({ [e.target.id]: e.target.value })
        }
    }

    generateProcessList = (processAmmount) => {
        const { algorithmData, setAlgorithmData } = this.context
        let processes = algorithmData.processList
        for (let i = 0; i < processAmmount; i++) {
            let totalExecutionTime = randomIntFromInterval(5, 25)
            let priority = randomIntFromInterval(0, 3)
            let bytesToExecute = randomIntFromInterval(32, 1024)
            let process = { id: i, name: 'P' + i, status: 'ready', totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority, bytes: bytesToExecute }
            processes = [...processes, process]
        }
        if (algorithmData.algorithm === 'priority-queue') {
            processes = sortPriorityQueues(processes)
        }
        setAlgorithmData({ processList: processes })
    }

    generateCoreList = (coreAmmount) => {
        const { setAlgorithmData } = this.context
        let coreList = []
        for (let i = 0; i < coreAmmount; i++) {
            if (this.state.algorithm === 'sjf') {
                coreList.push({ id: i, name: 'Core ' + i, status: 'waiting for process', processInExecution: 'none', processInExecutionRemainingTime: -1 })
            } else if (this.state.algorithm === 'priority-queue') {
                coreList.push({ id: i, name: 'Core ' + i, status: 'waiting for process', processInExecution: 'none', currentQuantum: this.state.quantum, processInExecutionRemainingTime: -1, currentPriority: -1 })
            } else {
                coreList.push({ id: i, name: 'Core ' + i, status: 'waiting for process', processInExecution: 'none', currentQuantum: this.state.quantum, processInExecutionRemainingTime: -1 })
            }
        }
        setAlgorithmData({ coreList })
    }

    generateMemoryAllocation = (memoryAmmount) => {
        const { setAlgorithmData } = this.context
        setAlgorithmData({
            initialMemoryAvailability: Number.parseInt(memoryAmmount),
            memorySize: Number.parseInt(memoryAmmount),
        })
    }

    handleSubmit = (e) => {
        e.preventDefault()
        this.generateProcessList(this.state.processAmmount)
        this.generateCoreList(this.state.coreAmmount)
        this.generateMemoryAllocation(this.state.memoryAmmount)
        this.props.history.push('/scheduler')
    }

    render() {
        const { algorithmData } = this.context
        return (
            <div className="algorithm-selector">
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <input type="radio" name="algorithm" id="sjf" value="sjf" required onChange={this.handleChange} />
                        <label htmlFor="sjf">Shortest Job First (SJF)</label>
                    </div>

                    <div>
                        <input type="radio" name="algorithm" id="round-robin" value="round-robin" onChange={this.handleChange} />
                        <label htmlFor="round-robin">Round Robin</label>
                    </div>

                    <div>
                        <input type="radio" name="algorithm" id="priority-queue" value="priority-queue" onChange={this.handleChange} />
                        <label htmlFor="priority-queue">Priority Queue w/ Round Robin</label>
                    </div>

                    <div className={algorithmData.algorithm === 'round-robin' || algorithmData.algorithm === 'priority-queue' ? '' : 'hide'}>
                        {algorithmData.algorithm === 'round-robin' ? (
                            <div className="disclaimer">
                                This selection contains simulations for Swapping/Pagination algorithms on Virtual Memory/Disk management. (Best Fit)
                            </div>
                        ) : <div></div>}

                        <input className="algorithm-selector_input" type="number" name="quantum" id="quantum" placeholder="Quantum" min="2" max="20" onChange={this.handleChange} required={algorithmData.algorithm === 'round-robin' || algorithmData.algorithm === 'priority-queue'} />
                    </div>

                    <div>
                        <input className="algorithm-selector_input input-field" type="number" name="core-ammount" id="coreAmmount" max="64" placeholder="Core Ammount" onChange={this.handleChange} required />
                    </div>

                    <div>
                        <input className="algorithm-selector_input" type="number" name="process-ammount" id="processAmmount" max="200" placeholder="Process Ammount" onChange={this.handleChange} required />
                    </div>

                    <div className={algorithmData.algorithm === 'round-robin' ? '' : 'hide'}>
                        <div>
                            <input className="algorithm-selector_input input-field" type="number" name="memoryAmmount" id="memoryAmmount" placeholder="Memory Ammount" min="1024" onChange={this.handleChange} required={algorithmData.algorithm === 'round-robin'} />
                        </div>
                        <div>
                            <input type="radio" name="algorithmMemoryManager" id="bestFit" value="bestFit" required={algorithmData.algorithm === 'round-robin'} onChange={this.handleChange} />
                            <label htmlFor="bestFit">Best Fit</label>
                        </div>
                        <div>
                            <input type="radio" name="algorithmMemoryManager" id="mergeFit" value="mergeFit" required={algorithmData.algorithm === 'round-robin'} onChange={this.handleChange} />
                            <label htmlFor="mergeFit">Merge Fit</label>
                        </div>
                    </div>

                    <button className="algorithm-selector_button-submit" type="submit">Start Scheduler Simulation</button>
                </form>
            </div>
        )
    }
}

export default AlgorithmSelector
