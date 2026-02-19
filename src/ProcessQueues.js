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
                            className={process.status === 'executing' ? 'process executing' : 'process'}
                            key={'p' + process.id}
                        >
                            <div className={process.inserted ? 'process_name inserted' : 'process_name'}>
                                {'P' + process.id}
                            </div>
                            <div>Status: {process.status}</div>
                            <div>TET: {process.totalExecutionTime}s</div>
                            <div>RET: {process.remainingExecutionTime}s</div>
                            <div>Priority: {process.priority}</div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}

export default ProcessQueues;
