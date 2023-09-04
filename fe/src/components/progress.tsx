'use client';
import { Fragment, useEffect, useState } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket";

import { useAppDispatch } from "../store/store"
import { Logger } from '@common/logger';
import { AppActions } from "@/store/app.slice";
import { refreshImages } from "@/store/images.slice";
import { BackendStatus } from '@/common/models/myapi.models';
import moment from 'moment';

export interface MessageFormat {
    type: string
    data: string | object
}

let id: NodeJS.Timer
export default function GeneratorProgress() {
    Logger.debug('Rendering GeneratorProgress')
    const dispatch = useAppDispatch()
    const [progress, setProgress] = useState<BackendStatus>()
    const [preview, setPreview] = useState<string>()

    const { lastMessage, readyState } = useWebSocket('ws://localhost:7999/ws', { shouldReconnect: () => true });

    useEffect(() => {
        if (!lastMessage) return
        let data = undefined
        try { data = JSON.parse(lastMessage.data) as MessageFormat } catch { Logger.warn(`Unable to parse websocket message '${lastMessage.data}'`) }
        if (!data) return
        Logger.debug('Message received', data)
        if (data.type === 'error') {
            dispatch(AppActions.addMessage(data.data))
        }
        if (data.type === 'txt2img') {
            dispatch(refreshImages())
        }
        else if (data.type === 'info') {
            dispatch(AppActions.addMessage(data.data))
        }
        else if (data.type === 'test') {
            dispatch(AppActions.addMessage('[TEST]: ' + data.data))
        }
        else if (data.type === 'progress' && typeof data.data === 'object') {
            const newProgress = data.data as BackendStatus
            setProgress(newProgress)
            if (!newProgress.image) setPreview(undefined)
            else if (newProgress.image !== 'same') setPreview('data:image/png;base64,' + newProgress.image)
        }
    }, [dispatch, lastMessage])

    const wsStatus = getStatus(readyState)
    // useEffect(() => {
    //     Logger.debug('Websocket status changed to', wsStatus)
    // }, [wsStatus])

    let inner;
    if (!progress) inner = <></>
    else if (!progress.running) inner = <span>Idle, {progress.tasks.length} tasks</span>
    else {
        const timeStared = progress.started !== '0' ? moment(progress.started, 'YYYYMMDDHHmmss') : undefined
        const timeTaken = timeStared ? moment().diff(timeStared, 'seconds') : 0
        const progressSection = progress.skipped ? <div>Skipping...</div> : <div>Progress: {progress.progress} %</div>
        inner = (
            <Fragment>
                <span>Working, {progress.tasks.length} tasks</span>
                <div>{timeTaken} seconds elapsed</div>
                {progressSection}
                {reduceTaskTitles(progress.tasks).map(t => <div className="nowrap-ellipsis">☼{t}</div>)}
            </Fragment>
        )
    }

    return <div className="progress-container" style={{ backgroundImage: `url(${preview})` }}>
        <div className="progress-info">
            {wsStatus} {inner}
        </div>
    </div>
}

const getStatus = function (readyState: ReadyState) {
    return {
        [ReadyState.CONNECTING]: (<span title="Socket: Connecting">☑</span>),
        [ReadyState.OPEN]: (<span title="Socket: Connected">☑</span>),
        [ReadyState.CLOSING]: (<span title="Socket: Closing">☒</span>),
        [ReadyState.CLOSED]: (<span title="Socket: Closed">☒</span>),
        [ReadyState.UNINSTANTIATED]: (<span title="Socket: Uninstantiaed">☒</span>),
    }[readyState];
}

const reduceTaskTitles = function (titles: string[]) {
    const list = []
    let previousValue = ''
    let previousCount = 1
    for (const title of titles) {
        if (title === previousValue) {
            previousCount++
            continue
        }
        else if (previousValue !== '') {
            if (previousCount > 1) list.push(previousValue + ' x' + previousCount)
            else list.push(previousValue)
            previousCount = 1
        }
        previousValue = title
    }
    if (previousCount > 1) list.push(previousValue + ' x' + previousCount)
    else list.push(previousValue)
    return list
}