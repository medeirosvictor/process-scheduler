import React from 'react';

const Core = ({cores}) => {
    const coreList = cores.map(core => {
        return (
            <div className={core.status === 'executing' ? 'core executing': 'core'} key={"p" + core.id}>
                <div className="core_name">{core.name} 
                {core.status === "executing" ? 
                    (<div className="lds-dual-ring"></div>)
                    :
                    (<div></div>)
                    }
                </div>
                <div>Status: {core.status}</div>
                <div className="core_process-ret">PIE: {core.processInExecution}</div>
                <div className={core.processInExecutionRemainingTime >= 0 ? '' : 'hide'}>PIE Remaining Time: {core.processInExecutionRemainingTime}s</div>
                <div className={core.currentQuantum >= 0 ? '' : 'hide'}>Current Quantum: {core.currentQuantum}s</div>
                <div className={core.currentPriority >= 0 ? '' : 'hide'}>Current Priority: {core.currentPriority}</div>
            </div>
        )
    });

    return (
        <div className="core-list">
            { coreList }
        </div>
    )
};

export default Core;