import React, { Component } from 'react';
import AlgorithmSelector from './AlgorithmSelector';
import Process from './Process';
import AddProcess from './AddProcess';

class App extends Component {
    state = {
        processes: [
            {id: 1, status: 'waiting', totalExecutionTime: 8, remainingExecutionTime: 4, priority: 1},
            {id: 2, status: 'waiting', totalExecutionTime: 20, remainingExecutionTime: 20, priority: 2},
            {id: 3, status: 'waiting', totalExecutionTime: 18, remainingExecutionTime: 2, priority: 3}
        ]
    }

    randomIntFromInterval = (min,max) => {
        return Math.floor(Math.random()*(max-min+1)+min);
    }

    addProcess = (process) => {
        let processes = [...this.state.processes, process];
        this.setState({
            processes: processes
        });
    }

  render() {
    return (
        <div className="App">
            <h1 className="header">Process Scheduler</h1>
            <AlgorithmSelector/>
            <AddProcess addProcess={this.addProcess}/>
            <Process processes={this.state.processes}/>
        </div>
    );
  }
}

export default App;
