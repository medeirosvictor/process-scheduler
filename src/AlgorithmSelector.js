import React, { Component } from 'react';

class AlgorithmSelector extends Component {
    state = {
        algorithm: '',
        coreAmmount: 0,
        processAmmount: 0
    }

    handleChange = (e) => {
        if (e.target.name === 'algorithm') {
            this.setState({
                algorithm: e.target.value
            });
        } else {
            this.setState({
                [e.target.id]: e.target.value
            });
        }
    }

    handleSubmit = (e) => {
        e.preventDefault();
        console.log(this.state);
    }

    render() {
        return (
            <div className="algorithm-selector">
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <input type="radio" name="algorithm" id="sjf" value="sjf" required onChange={this.handleChange}/>
                        <label htmlFor="sjf">Shortest Job First</label>
                    </div>

                    <div>
                        <input type="radio" name="algorithm" id="round-robin" value="round-robin"/>
                        <label htmlFor="round-robin">Round Robin</label>
                    </div>

                    <div>
                        <input type="radio" name="algorithm" id="priority-queue" value="priority-queue"/>
                        <label htmlFor="priority-queue">Priority Queue</label>
                    </div>

                    <div>
                        <input type="number" name="core-ammount" id="coreAmmount" max="64" placeholder="Core Ammount" onChange={this.handleChange} required/>
                    </div>

                    <div>
                        <input type="number" name="process-ammount" id="processAmmount" max="200" placeholder="Process Ammount" onChange={this.handleChange} required/>
                    </div>

                    <button type="submit">Start Scheduler Simulation</button>
                </form>
            </div>
        )
    }
}

export default AlgorithmSelector;
