import React from 'react';

const ProcessQueues = ({ processes }) => {
    const priorityLevels = Object.keys(processes).map(Number)

    return (
        <div className="process-queue-list">
            {priorityLevels.map(level => (
                <div className="process-list" key={level}>
                    <div className="process-queue-priority">
                        Priority {level}
                    </div>
                    {processes[level].map(process => (
                        <div
                            className={`process ${process.status === 'executing' ? 'executing' : ''}`}
                            key={'p' + process.id}
                        >
                            <div className={`process_name ${process.inserted ? 'inserted' : ''}`}>
                                {'P' + process.id}
                            </div>
                            <div className="process-detail">Status: {process.status}</div>
                            <div className="process-detail">TET: {process.totalExecutionTime}s</div>
                            <div className="process-detail">RET: {process.remainingExecutionTime}s</div>
                            <div className="process-detail">Priority: {process.priority}</div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

export default ProcessQueues;
