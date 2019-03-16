import React, { Component } from 'react';
import { getAlgorithmData } from './Selector'
import { connect } from 'react-redux'
import { createPropsSelector } from 'reselect-immutable-helpers'

class AddProcess extends Component {
    constructor(props) {
        super(props)
        this.state = this.props.algorithmData
    }

    randomIntFromInterval = (min,max) => {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    handleClick = (e) => {
        // eslint-disable-next-line
        let id = Math.max.apply(Math, this.state.processList.map(function(process) { return process.id; }));
        debugger
        let process = {id: id + 1, status: 'waiting', totalExecutionTime: 18, remainingExecutionTime: 2, priority: 3}
        this.props.addProcess(process);
    }

    render() {
        return (
            <div className="add-process-container">
                <button onClick={this.handleClick}>Add Random Process</button>
            </div>
        );
    }
}

const mapStateToProps = createPropsSelector({
    algorithmData: getAlgorithmData
})

export default connect(mapStateToProps) (AddProcess)
