import React from 'react';

const Memory = ({memoryBlocks}) => {
    const memoryBlocksList = memoryBlocks.slice(0).reverse().map(memoryBlock => {
        if (memoryBlock.size) {
            return (
                <div className='memory-block'>
                    <div>Block ID: { memoryBlock.id }</div>
                    <div>Size: { memoryBlock.size } bytes</div>
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