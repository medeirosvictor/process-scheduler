import React from 'react';

// class AlgorithmSelector extends Component
const Processes = ({processes}) => {
    let priorityList0 = []
    let priorityList1 = []
    let priorityList2 = []
    let priorityList3 = []
    for(let i = 0; i < Object.keys(processes).length; i++) {
        if(i === 0) {
            priorityList0 = processes[i].map(process => {
                return (
                    <div className={process.status === 'executing' ? 'process executing': 'process'} key={"p" + process.id}
                    data-process-info={JSON.stringify(process)}>
                        <div className={process.inserted ? "process_name inserted" : "process_name"}>{"P" + process.id}</div>
                        <div>Status: {process.status}</div>
                        <div>TET: {process.totalExecutionTime}s</div>
                        <div>Priority: {process.priority}</div>
                    </div>
                )
            });
        } else if (i === 1) {
            priorityList1 = processes[i].map(process => {
                return (
                    <div className={process.status === 'executing' ? 'process executing': 'process'} key={"p" + process.id}
                    data-process-info={JSON.stringify(process)}>
                        <div className={process.inserted ? "process_name inserted" : "process_name"}>{"P" + process.id}</div>
                        <div>Status: {process.status}</div>
                        <div>TET: {process.totalExecutionTime}s</div>
                        <div>Priority: {process.priority}</div>
                    </div>
                )
            });
        } else if (i === 2) {
            priorityList2 = processes[i].map(process => {
                return (
                    <div className={process.status === 'executing' ? 'process executing': 'process'} key={"p" + process.id}
                    data-process-info={JSON.stringify(process)}>
                        <div className={process.inserted ? "process_name inserted" : "process_name"}>{"P" + process.id}</div>
                        <div>Status: {process.status}</div>
                        <div>TET: {process.totalExecutionTime}s</div>
                        <div>Priority: {process.priority}</div>
                    </div>
                )
            });
        } else if (i === 3) {
            priorityList3 = processes[i].map(process => {
                return (
                    <div className={process.status === 'executing' ? 'process executing': 'process'} key={"p" + process.id}
                    data-process-info={JSON.stringify(process)}>
                        <div className={process.inserted ? "process_name inserted" : "process_name"}>{"P" + process.id}</div>
                        <div>Status: {process.status}</div>
                        <div>TET: {process.totalExecutionTime}s</div>
                        <div>Priority: {process.priority}</div>
                    </div>
                )
            });
        }
    }
    

    return (
        <div className="process-queue-list">
            <div className="process-list">
                <div className="process-queue-priority">
                    Priority 0
                </div>
                {priorityList0}
            </div>
            <div className="process-list">
                <div className="process-queue-priority">
                    Priority 1
                </div>
                {priorityList1}
            </div>
            <div className="process-list">
                <div className="process-queue-priority">
                    Priority 2
                </div>
                {priorityList2}
            </div>
            <div className="process-list">
                <div className="process-queue-priority">
                    Priority 3
                </div>
                {priorityList3}
            </div>
        </div>
    )
}

export default Processes;
