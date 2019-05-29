import React from 'react';

const MemoryPage = ({processList}) => {
    const memoryPage = processList.map(process => {
        debugger
        return (
            <div className="process-list_memory-page">
                <div>
                    PID: {process.processId}
                </div>
                <div>
                    REQ: {process.requestSize}
                </div>
            </div>
        )
    });

    return (
        <div className="memory-page_container">
            { memoryPage.length ? memoryPage : <div className="hide">No memory pages available</div> }
        </div>
    )
};

export default MemoryPage;