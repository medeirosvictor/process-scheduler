import React, { Component } from 'react';
import { receiveAlgorithmData } from './Actions'
import { connect } from 'react-redux'

class AlgorithmSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            algorithm: '',
            coreAmmount: 0,
            processAmmount: 0,
            quantum: false
        }
    }

    handleChange = (e) => {
        if (e.target.name === 'algorithm') {
            this.props.receiveAlgorithmData({
                algorithmData: {
                    algorithm: e.target.value,
                    quantum: (e.target.value === 'round-robin' ? true : false)
                }
            })
        } else {
            this.props.receiveAlgorithmData({
                algorithmData: {
                    [e.target.id]: e.target.value
                }
            })
        }
    }

    randomIntFromInterval = (min,max) => {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    generateProcessList = (processAmmount) => {
        let processList = [];
        for (let i = 0; i < processAmmount; i++) {
            let totalExecutionTime = this.randomIntFromInterval(4, 20);
            let priority = this.randomIntFromInterval(0, 3);
            processList.push({id: i, name: 'P'+i, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority});
        }

        return processList;
    }

    generateCoreList = (coreAmmount) => {
        let coreList = [];
        for (let i = 0; i < coreAmmount; i++) {
            coreList.push({id: i, name: 'Core '+i, status: 'waiting for process', processInExecution: {}});
        }

        return coreList;
    }

    handleSubmit = (e) => {
        e.preventDefault();
        console.log(this.state);
        let processList = this.generateProcessList(this.state.processAmmount);
        let coreList = this.generateCoreList(this.state.coreAmmount);
        console.log(processList);
        console.log(coreList);
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
                        <label htmlFor="priority-queue">Priority Queue</label>
                    </div>

                    <div className={this.state.quantum ? '' : 'hide'}>
                        <input type="number" name="quantum" id="quantum" placeholder="Quantum" min="2" max="20" onChange={this.handleChange} required={this.state.quantum ? true : false}/>
                    </div>

                    <div>
                        <input type="number" name="core-ammount" id="coreAmmount" max="64" placeholder="Core Ammount" onChange={this.handleChange} required/>
                    </div>

                    <div>
                        <input type="number" name="process-ammount" id="processAmmount" max="200" placeholder="Process Ammount" onChange={this.handleChange} required/>
                    </div>

                    <button type="submit">Start Scheduler Simulation</button>
                </form>
            </div>
        )
    }
}

const mapDispatchToProps = {
    receiveAlgorithmData
}

export default connect(undefined, mapDispatchToProps) (AlgorithmSelector);
