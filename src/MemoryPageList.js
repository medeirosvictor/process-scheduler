import React from 'react';
import MemoryPage from './MemoryPage';

/*
Attributes:
- list of objects containing [{processId:, requestSize:},...{}...{}]
*/ 

const MemoryPageList = ({memoryPages}) => {
    const memoryPageList = memoryPages.map(memoryPage => {
        return (
            <div className={memoryPage.type === 'free' ? 'memory-page free' : 'memory-page busy'} key={memoryPage.id}>
                <div className="bold">Page {memoryPage.id} - {memoryPage.currentPageSize} bytes occupied</div>
                <MemoryPage processList={memoryPage.blockList}/>
            </div>
        )
    });

    return (
        <div className="memory-page_container">
            { memoryPageList.length ? memoryPageList : <div className="hide">No disk pages available</div> }
        </div>
    )
};

export default MemoryPageList;