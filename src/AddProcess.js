import React, { Component } from 'react';
import $ from 'jquery';

class AddProcess extends Component {
    randomIntFromInterval = (min,max) => {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    handleClick = (e) => {
        let lastProcessInfo = $(".process:last-child").data('process-info');
        let process = {id: lastProcessInfo.id + 1, status: 'waiting', totalExecutionTime: 18, remainingExecutionTime: 2, priority: 3}
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

export default AddProcess;
