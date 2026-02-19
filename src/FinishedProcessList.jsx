import React from 'react';

const FinishedProcessList = ({processes}) => {
    const finishedProcesslist = processes.map(process => {
        return (
            <div className='process finished' key={"p" + process.id}>
                <div className='finished'>{"P" + process.id}</div>
                <div>Status: {process.status}</div>
                <div>TET: {process.totalExecutionTime}s</div>
            </div>
        )
    });

    return (
        <div className="process-list">
            { finishedProcesslist.length ? finishedProcesslist : <div className="process-list_no-process">No Process Finished</div>}
        </div>
    )
}

export default FinishedProcessList;
