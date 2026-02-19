import React, { Component } from 'react'
import AlgorithmSelector from './AlgorithmSelector'
import Scheduler from './Scheduler'
import ErrorBoundary from './ErrorBoundary'
import { AlgorithmProvider } from './AlgorithmContext'
import { HashRouter, Route, Switch } from 'react-router-dom'

class App extends Component {
    render() {
        return (
            <AlgorithmProvider>
                <HashRouter>
                    <ErrorBoundary>
                        <div className="App">
                            <h1 className="header">Process Scheduler</h1>
                            <div className="scheduler-app">
                                <Switch>
                                    <Route exact path='/' component={AlgorithmSelector} />
                                    <Route path='/scheduler' component={Scheduler} />
                                </Switch>
                            </div>
                        </div>
                    </ErrorBoundary>
                </HashRouter>
            </AlgorithmProvider>
        )
    }
}

export default App
