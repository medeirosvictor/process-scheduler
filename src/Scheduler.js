import React, { Component } from 'react';
import Process from './Process';
import Core from './Core';
import AddProcess from './AddProcess';
import { getAlgorithmData } from './Selector';
import { connect } from 'react-redux';
import {createPropsSelector} from 'reselect-immutable-helpers';

class Scheduler extends Component {
    /** 
    * Input
    *  - Algorithm Selector output
    *  - Algorithm Type
    *  - List of Cores
    *  - List of Processes
    */

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
                Scheduler
                {this.props.algorithmData.algorithm}
                <AddProcess addProcess={this.addProcess}/>
                <Core cores={this.state.cores} />
                <Process processes={this.state.processes}/>
            </div>
        );
    }
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData
})

export default connect(mapStateToProps) (Scheduler);
