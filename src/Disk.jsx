import React from 'react'
import Page from './Page'

const Disk = ({diskPages}) => {
    const diskPagesList = diskPages.map(diskPage => {
        return (
            <div className="disk-page" key={diskPage.id}>
                <div className="bold">Page {diskPage.id} - {diskPage.currentPageSize} bytes occupied</div>
                <Page blockList={diskPage.blockList}/>
            </div>
        )
    });

    return (
        <div className="disk-page_container">
            { diskPagesList.length ? diskPagesList : <div className="hide">No disk pages available</div> }
        </div>
    )
};

export default Disk;