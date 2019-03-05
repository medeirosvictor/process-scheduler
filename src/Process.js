import React from 'react';

const Processes = ({processes}) => {
    const processList = processes.map(process => {
        return (
            <div className="process" key={"p" + process.id}
            data-process-info={JSON.stringify(process)}>
                <div>Process: {"P" + process.id}</div>
                <div>Status: {process.status}</div>
                <div>Total execution time: {process.totalExecutionTime}</div>
                <div>Remaining Process time: {process.remainingExecutionTime}</div>
                <div>Priority: {process.priority}</div>
            </div>
        )
    });

    return (
        <div className="process-list">
            { processList }
        </div>
    )
}

export default Processes;
