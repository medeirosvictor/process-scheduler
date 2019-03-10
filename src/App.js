import React, { Component } from 'react'
import AlgorithmSelector from './AlgorithmSelector'
import Scheduler from './Scheduler'
import { Provider } from 'react-redux'
import { BrowserRouter, Route } from 'react-router-dom'

class App extends Component {
    render() {
        return (
            <Provider store={this.props.store}>
                <BrowserRouter>
                    <div className="App">
                        <h1 className="header">Process Scheduler</h1>
                        <div className="process-scheduler-app">
                            <Route exact path='/' component={AlgorithmSelector} />
                            <Route path='/scheduler' component={Scheduler} />
                        </div>
                    </div>
                </BrowserRouter>
            </Provider>
        );
    }
}

export default App;
