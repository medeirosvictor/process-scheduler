import React, { Component } from 'react';
import AlgorithmSelector from './AlgorithmSelector';
import Scheduler from './Scheduler';
import { Provider } from 'react-redux';

class App extends Component {
    render() {
        return (
            <Provider store={this.props.store}>
                <div className="App">
                    <h1 className="header">Process Scheduler</h1>
                    <AlgorithmSelector/>
                    <Scheduler />
                </div>
            </Provider>
        );
    }
}

export default App;
