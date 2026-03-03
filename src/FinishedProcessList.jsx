import React from 'react';

const FinishedProcessList = ({processes}) => {
    const finishedProcesslist = processes.map(process => {
        return (
            <div className='process finished' key={"p" + process.id}>
                <div className='process_name'>{"P" + process.id}</div>
                <div className="process-detail">Status: {process.status}</div>
                <div className="process-detail">TET: {process.totalExecutionTime}s</div>
            </div>
        )
    });

    return (
        <div className="process-list">
            {finishedProcesslist.length > 0 ? finishedProcesslist : (
                <div className="process-list_no-process">No Process Finished</div>
            )}
        </div>
    )
}

export default FinishedProcessList;
