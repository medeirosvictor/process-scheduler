import React from 'react';

const Processes = ({processes}) => {
    const processList = processes.map(process => {
        return (
            <div 
                className={`process ${process.status === 'executing' ? 'executing' : ''}`} 
                key={"p" + process.id}
            >
                <div className={`process_name ${process.inserted ? 'inserted' : ''}`}>
                    {"P" + process.id}
                    {process.status === "executing" && (
                        <div className="lds-dual-ring"></div>
                    )}
                </div>
                <div className="process-detail">Status: {process.status}</div>
                <div className="process-detail">TET: {process.totalExecutionTime}s</div>
                <div className="process-detail">RET: {process.remainingExecutionTime}s</div>
                {process.bytes && (
                    <div className="process-detail">Size: {process.bytes} bytes</div>
                )}
            </div>
        )
    });

    return (
        <div className="process-list">
            {processList.length > 0 ? processList : (
                <div className="process-list_no-process">No Process left to execute!</div>
            )}
        </div>
    )
}

export default Processes;
