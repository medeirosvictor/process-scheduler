import React from 'react';

const Core = ({cores}) => {
    const coreList = cores.map(core => {
        return (
            <div className={core.status === 'executing' ? 'core executing': 'core'} key={"p" + core.id}
            data-core-info={JSON.stringify(core)}>
                <div className="core_name">{core.name}</div>
                <div>Status: {core.status}</div>
                <div>PIE: {core.processInExecution}</div>
                <div className={core.currentPriority >= 0 ? '' : 'hide'}>Current Priority: {core.currentPriority}</div>
                <div className={core.currentQuantum >= 0 ? '' : 'hide'}>Current Quantum: {core.currentQuantum}s</div>
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