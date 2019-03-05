import React, { Component } from 'react';

class AlgorithmSelector extends Component {
    render() {
        return (
            <div className="algorithm-selector">
                <form action="">
                    <div>
                        <input type="radio" name="sjf" id="sjf" value="sjf"/>
                        <label htmlFor="sjf">Shortest Job First</label>
                    </div>

                    <div>
                        <input type="radio" name="round-robin" id="round-robin" value="round-robin"/>
                        <label htmlFor="round-robin">Round Robin</label>
                    </div>

                    <div>
                        <input type="radio" name="priority-queue" id="priority-queue" value="priority-queue"/>
                        <label htmlFor="priority-queue">Priority Queue</label>
                    </div>

                    <div>
                        <input type="number" name="core-ammount" id="core-ammount" max="64" placeholder="Core Ammount"/>
                    </div>

                    <div>
                        <input type="number" name="process-ammount" id="process-ammount" max="200" placeholder="Process Ammount"/>
                    </div>

                    <button type="submit">Start Scheduler Simulation</button>
                </form>
            </div>
        )
    }
}

export default AlgorithmSelector;
