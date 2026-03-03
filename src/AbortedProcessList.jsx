import React from 'react';

const AbortedProcessList = ({processes}) => {
    const abortedProcesslist = processes.map(process => {
        return (
            <div className='process finished aborted' key={"p" + process.id}>
                <div className='process_name'>{"P" + process.id}</div>
                <div className="process-detail">Status: {process.status}</div>
                <div className="process-detail">TET: {process.totalExecutionTime}s</div>
                {process.bytes && (
                    <div className="process-detail">Size: {process.bytes} bytes</div>
                )}
            </div>
        )
    });

    return (
        <div className="process-list">
            {abortedProcesslist.length > 0 ? abortedProcesslist : (
                <div className="process-list_no-process">No Process Aborted</div>
            )}
        </div>
    )
}

export default AbortedProcessList;
