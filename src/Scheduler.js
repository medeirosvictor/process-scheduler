import React, { Component } from 'react';
import Process from './Process';
import Core from './Core';
import AddProcess from './AddProcess';
import { getAlgorithmData } from './Selector';
import { connect } from 'react-redux';
import { createPropsSelector } from 'reselect-immutable-helpers';

class Scheduler extends Component {
    /** 
    * Input
    *  - Algorithm Selector output
    *  - Algorithm Type
    *  - List of Cores
    *  - List of Processes
    */

    constructor(props) {
        super(props);
        if (this.props.algorithmData.algorithm === '') {
            this.props.history.push('/')
        }
    }

    state = {
        processes: [
            {id: 1, status: 'waiting', totalExecutionTime: 8, remainingExecutionTime: 4, priority: 1},
            {id: 2, status: 'waiting', totalExecutionTime: 20, remainingExecutionTime: 20, priority: 2},
            {id: 3, status: 'waiting', totalExecutionTime: 18, remainingExecutionTime: 2, priority: 3}
        ],
        cores: [
            {id: 1, name: 'Core 1', status: 'waiting for process', processInExecution: ''}
        ]
    }

    addProcess = (process) => {
        let processes = [...this.state.processes, process];
        this.setState({
            processes: processes
        });
    }

    render () {
        return (
            <div>
                <div>
                    Scheduler Info
                    <div>
                        Algorithm: {this.props.algorithmData.algorithm}
                    </div>
                </div>
                <AddProcess addProcess={this.addProcess}/>
                <Core cores={this.props.algorithmData.coreList} />
                <Process processes={this.props.algorithmData.processList}/>
            </div>
        );
    }
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData
})

export default connect(mapStateToProps) (Scheduler);
