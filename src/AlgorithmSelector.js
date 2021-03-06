import React, { Component } from 'react';
import { receiveAlgorithmData, resetAlgorithmData  } from './Actions'
import { connect } from 'react-redux'
import { getAlgorithmData } from './Selector'
import { createPropsSelector } from 'reselect-immutable-helpers'
import { randomIntFromInterval, sortPriorityQueues } from './HelperFunctions'

class AlgorithmSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            algorithm: '',
            coreAmmount: 0,
            processAmmount: 0,
            quantum: -1,
            algorithmMemoryManager: '',
            freeMemoryBlocks: []
        }

        props.resetAlgorithmData()
    }

    handleChange = (e) => {
        if (e.target.name === 'algorithm') {
            this.props.receiveAlgorithmData({
                algorithmData: {
                    algorithm: e.target.value
                }
            })
        } else if (e.target.name === 'quantum'){
            this.props.receiveAlgorithmData({
                algorithmData: {
                    quantum: Number.parseInt(e.target.value)
                }
            })
            this.setState({
                [e.target.id]: e.target.value
            })

        } else if (e.target.name === 'algorithmMemoryManager') {
            this.props.receiveAlgorithmData({
                algorithmData: {
                    algorithmMemoryManager: e.target.value
                }
            })
            this.setState({
                algorithmMemoryManager: e.target.value
            })
        } else {
            this.props.receiveAlgorithmData({
                algorithmData: {
                    [e.target.id]: e.target.value
                }
            })
            this.setState({
                [e.target.id]: e.target.value
            })
        }
    }

    generateProcessList = (processAmmount) => {
        let processes = this.props.algorithmData.processList
        for (let i = 0; i < processAmmount; i++) {
            let totalExecutionTime = randomIntFromInterval(5, 25)
            let priority = randomIntFromInterval(0, 3)
            let bytesToExecute = randomIntFromInterval(32, 1024)
            let process = {id: i, name: 'P'+i, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority, bytes: bytesToExecute}
            processes = [...processes, process];
        }
        if (this.props.algorithmData.algorithm === 'priority-queue') {
            processes = sortPriorityQueues(processes)
        }

        this.props.receiveAlgorithmData({
            algorithmData: {
                processList: processes
            }
        })
    }

    generateCoreList = (coreAmmount) => {
        let coreList = [];
        for (let i = 0; i < coreAmmount; i++) {
            if (this.state.algorithm === 'sjf') {
                coreList.push({id: i, name: 'Core '+i, status: 'waiting for process', processInExecution: 'none', processInExecutionRemainingTime: -1});
            } else if(this.state.algorithm === 'priority-queue') {
                coreList.push({id: i, name: 'Core '+i, status: 'waiting for process', processInExecution: 'none', currentQuantum: this.state.quantum, processInExecutionRemainingTime: -1, currentPriority: -1});
            }
            else {
                coreList.push({id: i, name: 'Core '+i, status: 'waiting for process', processInExecution: 'none', currentQuantum: this.state.quantum, processInExecutionRemainingTime: -1});
            }
        }

        this.props.receiveAlgorithmData({
            algorithmData: {
                coreList: coreList
            }
        })
    }

    generateMemoryAllocation = (memoryAmmount) => {
        this.props.receiveAlgorithmData({
            algorithmData: {
                initialMemoryAvailability: Number.parseInt(memoryAmmount),
                memorySize: Number.parseInt(memoryAmmount)
            }
        })
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.generateProcessList(this.state.processAmmount)
        this.generateCoreList(this.state.coreAmmount)
        this.generateMemoryAllocation(this.state.memoryAmmount)
        this.props.history.push('/scheduler')
    }

    render() {
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

                    <div className={this.props.algorithmData.algorithm === 'round-robin' || this.props.algorithmData.algorithm === 'priority-queue' ? '' : 'hide'}>
                        {
                            this.props.algorithmData.algorithm === 'round-robin' ? (
                                <div className="disclaimer">
                                    This selection contains simulations for Swapping/Pagination algorithms on Virtual Memory/Disk management. (Best Fit)
                                </div>
                            ) : (
                                <div></div>
                            )
                        }
                        
                        <input className="algorithm-selector_input " type="number" name="quantum" id="quantum" placeholder="Quantum" min="2" max="20" onChange={this.handleChange} required={this.props.algorithmData.algorithm === 'round-robin' || this.props.algorithmData.algorithm === 'priority-queue' ? true : false}/>
                    </div>

                    <div>
                        <input className="algorithm-selector_input input-field" type="number" name="core-ammount" id="coreAmmount" max="64" placeholder="Core Ammount" onChange={this.handleChange} required/>
                    </div>

                    <div>
                        <input className="algorithm-selector_input" type="number" name="process-ammount" id="processAmmount" max="200" placeholder="Process Ammount" onChange={this.handleChange} required/>
                    </div>

                    <div className={this.props.algorithmData.algorithm === 'round-robin' ? '' : 'hide'}>
                        <div>
                            <input className="algorithm-selector_input input-field" type="number" name="memoryAmmount" id="memoryAmmount" placeholder="Memory Ammount" min="1024" onChange={this.handleChange} required={this.props.algorithmData.algorithm === 'round-robin' ? true : false}/>
                        </div>
                        <div>
                            <input type="radio" name="algorithmMemoryManager" id="bestFit" value="bestFit" required={this.props.algorithmData.algorithm === 'round-robin' ? true : false} onChange={this.handleChange} />
                            <label htmlFor="bestFit">Best Fit</label>
                        </div>
                        <div>
                            <input type="radio" name="algorithmMemoryManager" id="mergeFit" value="mergeFit" required={this.props.algorithmData.algorithm === 'round-robin' ? true : false} onChange={this.handleChange} />
                            <label htmlFor="mergeFit">Merge Fit</label>
                        </div>
                    </div>

                    <button className="algorithm-selector_button-submit" type="submit">Start Scheduler Simulation</button>
                </form>
            </div>
        )
    }
}

const mapDispatchToProps = {
    receiveAlgorithmData,
    resetAlgorithmData
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData
})

export default connect(mapStateToProps, mapDispatchToProps) (AlgorithmSelector);
