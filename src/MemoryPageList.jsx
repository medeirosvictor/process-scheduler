import React from 'react'
import Page from './Page'

/*
Attributes:
- list of objects containing [{processId:, requestSize:},...{}...{}]
*/ 

const MemoryPageList = ({memoryPages}) => {
    const memoryPageList = memoryPages.map(memoryPage => {
        return (
            <div 
                className={`memory-page ${memoryPage.type === 'free' ? 'free' : 'busy'}`} 
                key={"mpl" + memoryPage.id}
            >
                <div className="page-header">Page {memoryPage.id} - {memoryPage.currentPageSize} bytes occupied</div>
                <Page blockList={memoryPage.blockList}/>
            </div>
        )
    });

    return (
        <div className="memory-page_container">
            {memoryPageList.length > 0 && memoryPageList}
        </div>
    )
};

export default MemoryPageList;
