import React from 'react';

const Memory = ({memoryBlocks}) => {
    const memoryBlocksList = memoryBlocks.map(memoryBlock => {
        if (memoryBlock.size) {
            return (
                <div 
                    className={`memory-block ${memoryBlock.type === 'free' ? 'free' : 'busy'}`} 
                    key={"memoryblock" + memoryBlock.id}
                >
                    <div className="block-detail">Block ID: {memoryBlock.id}</div>
                    <div className="block-detail">Block PID: {memoryBlock.type === 'free' ? 'free' : 'P' + memoryBlock.pid}</div>
                    <div className="block-detail">Size: {memoryBlock.size} bytes</div>
                    <div className="block-detail">Request Size: {memoryBlock.reqsize} bytes</div>
                </div>
            )
        }
        return null
    });

    return (
        <div className="memory-block_container">
            {memoryBlocksList.length > 0 && memoryBlocksList}
        </div>
    )
};

export default Memory;
