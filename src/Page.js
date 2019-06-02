import React from 'react';

const Page = ({processList}) => {
    const memoryPage = processList.map((process, index) => {
        return (
            <div className="memory-page_process" key={index}>
                <div>
                    Process ID: {process.processId}
                </div>
                <div>
                    Size: {process.requestSize} bytes
                </div>
                <div>
                    Current Request: {process.currentRequestSize} bytes
                </div>
                <div>
                    Type: {process.type}
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

export default Page;