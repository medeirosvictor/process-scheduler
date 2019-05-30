import React from 'react';

const MemoryPage = ({processList}) => {
    const memoryPage = processList.map((process, index) => {
        return (
            <div className="memory-page_process" key={index}>
                <div>
                    PID: P{process.processId}
                </div>
                <div>
                    REQ: {process.requestSize} bytes
                </div>
            </div>
        )
    });

    return (
        <div className="memory-page_process-list">
            { memoryPage.length ? memoryPage : <div className="hide">No memory pages available</div> }
        </div>
    )
};

export default MemoryPage;