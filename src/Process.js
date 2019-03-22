import React from 'react';

const Processes = ({processes}) => {
    const processList = processes.map(process => {
        return (
            <div className={process.status === 'executing' ? 'process executing': 'process'} key={"p" + process.id}
            data-process-info={JSON.stringify(process)}>
                <div className={process.inserted ? "process_name inserted" : "process_name"}>{"P" + process.id}</div>
                <div>Status: {process.status}</div>
                <div>TET: {process.totalExecutionTime}s</div>
            </div>
        )
    });

    return (
        <div className="process-list">
            { processList.length ? processList : <div className="process-list_no-process">No Process left to execute!</div>}
        </div>
    )
}

export default Processes;
