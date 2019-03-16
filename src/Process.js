import React from 'react';

const Processes = ({processes}) => {
    const processList = processes.map(process => {
        return (
            <div className={process.status === 'executing' ? 'process executing': 'process'} key={"p" + process.id}
            data-process-info={JSON.stringify(process)}>
                <div className="process_name">{"P" + process.id}</div>
                <div>Status: {process.status}</div>
                <div>TET: {process.totalExecutionTime}s</div>
                <div>RET: {process.remainingExecutionTime}s</div>
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
