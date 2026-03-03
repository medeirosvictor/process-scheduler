import React from 'react'

const Page = ({blockList}) => {
    const memoryPage = blockList.map((block, index) => {
        return (
            <div 
                className={`page-block ${block.type === 'free' ? 'free' : 'busy'}`} 
                key={index}
            >
                <div className="block-info">Process ID: {block.processId !== null ? 'P' + block.processId : 'None'}</div>
                <div className="block-info">Size: {block.size} bytes</div>
                <div className="block-info">Current Request: {block.currentRequestSize} bytes</div>
                <div className="block-info">Type: {block.type}</div>
            </div>
        )
    });

    return (
        <div className="page-block-list">
            {memoryPage.length > 0 && memoryPage}
        </div>
    )
};

export default Page;
