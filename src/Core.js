import React from 'react';

const Core = ({cores}) => {
    const coreList = cores.map(core => {
        return (
            <div className="core" key={"p" + core.id}
            data-core-info={JSON.stringify(core)}>
                <div>Core Name: {core.name}</div>
                <div>Status: {core.status}</div>
                <div>Process In Execution: {core.processInExecution}</div>
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