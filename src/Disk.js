import React from 'react';

const Disk = ({diskPages}) => {
    const diskPagesList = diskPages.map(diskPage => {
        if (diskPage.size) {
            return (
                <div className={diskPage.type === 'free' ? 'disk-page free' : 'disk-page busy'}>
                    <div>Block ID: {diskPage.id }</div>
                    <div>Block PID: {diskPage.type === 'free' ? 'free' : 'P' + diskPage.pid }</div>
                    <div>Size: { diskPage.size } bytes</div>
                    <div>Request Size: { diskPage.reqsize } bytes</div>
                </div>
            )
        }
        return false
    });

    return (
        <div className="disk-page_container">
            { diskPagesList.length ? diskPagesList : <div className="hide">No disk pages available</div> }
        </div>
    )
};

export default Disk;