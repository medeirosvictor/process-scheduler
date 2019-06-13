import React from 'react'

const Page = ({blockList}) => {
    const memoryPage = blockList.map((block, index) => {
        return (
            <div className={block.type === 'free'? "page-block free" : "page-block busy"} key={index}>
                <div>
                    Process ID: {block.processId !== null ? 'P'+block.processId : 'None'}
                </div>
                <div>
                    Size: {block.size} bytes
                </div>
                <div>
                    Current Request: {block.currentRequestSize} bytes
                </div>
                <div>
                    Type: {block.type}
                </div>
            </div>
        )
    });

    return (
        <div className="page-block-list">
            { memoryPage.length ? memoryPage : <div className="hide">No memory pages available</div> }
        </div>
    )
};

export default Page;