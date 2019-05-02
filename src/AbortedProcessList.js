import React from 'react';

const AbortedProcessList = ({processes}) => {
    const abortedProcesslist = processes.map(process => {
        return (
            <div className='process finished aborted' key={"p" + process.id}>
                <div className='finished'>{"P" + process.id}</div>
                <div>Status: {process.status}</div>
                <div>TET: {process.totalExecutionTime}s</div>
                <div>Size: {process.bytes} bytes</div>
            </div>
        )
    });

    return (
        <div className="process-list">
            { abortedProcesslist.length ? abortedProcesslist : <div className="process-list_no-process">No Process Aborted</div>}
        </div>
    )
}

export default AbortedProcessList;
