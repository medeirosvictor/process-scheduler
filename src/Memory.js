import React from 'react';

const Memory = ({memoryBlocks}) => {
    const memoryBlocksList = memoryBlocks.map(memoryBlock => {
        if (memoryBlock.size) {
            return (
                <div className={memoryBlock.type === 'free' ? 'memory-block free' : 'memory-block busy'} key={memoryBlock.id}>
                    <div>Block ID: {memoryBlock.id }</div>
                    <div>Block PID: {memoryBlock.type === 'free' ? 'free' : 'P' + memoryBlock.pid }</div>
                    <div>Size: { memoryBlock.size } bytes</div>
                    <div>Request Size: { memoryBlock.reqsize } bytes</div>
                </div>
            )
        }
        return false
    });

    return (
        <div className="memory-block_container">
            { memoryBlocksList.length ? memoryBlocksList : <div className="hide">No memory</div> }
        </div>
    )
};

export default Memory;