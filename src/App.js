import React, { Component } from 'react';
import AlgorithmSelector from './AlgorithmSelector';
import Process from './Process';

class App extends Component {
    state = {
        processes: [
            {id: 1, status: 'waiting', totalExecutionTime: 8, remainingExecutionTime: 4, priority: 1},
            {id: 2, status: 'waiting', totalExecutionTime: 20, remainingExecutionTime: 20, priority: 2},
            {id: 3, status: 'waiting', totalExecutionTime: 18, remainingExecutionTime: 2, priority: 3}
        ]
    }

  render() {
    return (
        <div className="App">
            <h1>Process Scheduler</h1>
            <AlgorithmSelector/>
            <Process processes={this.state.processes}/>
        </div>
    );
  }
}

export default App;
