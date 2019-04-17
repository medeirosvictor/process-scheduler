import React from 'react';

const MemoryBlocks = ({memory}) => {
    const memory = memory.map(memoryBlock => {
        return (
            <div>
               { memoryBlock.size }
            </div>
        )
    });

    return (
        <div className="core-list">
            { MemoryBlocks }
        </div>
    )
};

export default MemoryBlocks;