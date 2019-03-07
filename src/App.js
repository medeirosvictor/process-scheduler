import React, { Component } from 'react';
import AlgorithmSelector from './AlgorithmSelector';
import Scheduler from './Scheduler';

class App extends Component {
    state = {}

    render() {
        return (
            <div className="App">
                <h1 className="header">Process Scheduler</h1>
                <AlgorithmSelector/>
                <Scheduler />
            </div>
        );
    }
}

export default App;
