import React from 'react';

const Core = ({cores}) => {
    const coreList = cores.map(core => {
        return (
            <div 
                className={`core ${core.status === 'executing' ? 'executing' : ''}`} 
                key={"p" + core.id}
            >
                <div className="core_name">
                    {core.name}
                    {core.status === "executing" && (
                        <div className="lds-dual-ring"></div>
                    )}
                </div>
                <div className="core-detail">Status: {core.status}</div>
                <div className="core_process-ret">PIE: {core.processInExecution}</div>
                {core.processInExecutionRemainingTime >= 0 && (
                    <div className="core-detail">PIE Remaining Time: {core.processInExecutionRemainingTime}s</div>
                )}
                {core.currentQuantum >= 0 && (
                    <div className="core-detail">Current Quantum: {core.currentQuantum}s</div>
                )}
                {core.currentPriority >= 0 && (
                    <div className="core-detail">Current Priority: {core.currentPriority}</div>
                )}
            </div>
        )
    });

    return (
        <div className="core-list">
            {coreList}
        </div>
    )
};

export default Core;
