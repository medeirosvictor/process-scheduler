import React, { Component } from 'react';
import { receiveAlgorithmData } from './Actions'
import { connect } from 'react-redux'
import { getAlgorithmData } from './Selector'
import { createPropsSelector } from 'reselect-immutable-helpers'

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
                    quantum: (e.target.value === 'round-robin' || e.target.value === 'priority-queue' ? true : false)
                }
            })
        } else {
            this.setState({
                [e.target.id]: e.target.value
            })
        }
    }

    randomIntFromInterval = (min,max) => {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    generateProcessList = (processAmmount) => {
        let processes = this.props.algorithmData.processList
        for (let i = 0; i < processAmmount; i++) {
            let totalExecutionTime = this.randomIntFromInterval(4, 20);
            let priority = this.randomIntFromInterval(0, 3);
            let process = {id: i, name: 'P'+i, status: 'ready', totalExecutionTime: totalExecutionTime, remainingExecutionTime: totalExecutionTime, priority: priority}
            processes = [...processes, process];
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
            coreList.push({id: i, name: 'Core '+i, status: 'waiting for process', processInExecution: 'none'});
        }

        this.props.receiveAlgorithmData({
            algorithmData: {
                coreList: coreList
            }
        })
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.generateProcessList(this.state.processAmmount);
        this.generateCoreList(this.state.coreAmmount);
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

                    <div className={this.props.algorithmData.quantum ? '' : 'hide'}>
                        <input className="algorithm-selector_input " type="number" name="quantum" id="quantum" placeholder="Quantum" min="2" max="20" onChange={this.handleChange} required={this.props.algorithmData.quantum ? true : false}/>
                    </div>

                    <div>
                        <input className="algorithm-selector_input input-field" type="number" name="core-ammount" id="coreAmmount" max="64" placeholder="Core Ammount" onChange={this.handleChange} required/>
                    </div>

                    <div>
                        <input className="algorithm-selector_input" type="number" name="process-ammount" id="processAmmount" max="200" placeholder="Process Ammount" onChange={this.handleChange} required/>
                    </div>

                    <button className="algorithm-selector_button-submit" type="submit">Start Scheduler Simulation</button>
                </form>
            </div>
        )
    }
}

const mapDispatchToProps = {
    receiveAlgorithmData
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData
})

export default connect(mapStateToProps, mapDispatchToProps) (AlgorithmSelector);
