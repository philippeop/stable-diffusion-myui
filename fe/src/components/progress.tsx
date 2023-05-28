'use client';
import { Fragment, useEffect, useState } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket";

import { useAppDispatch } from "../store/store"
import { Logger } from '@common/logger';
import { addMessage } from "@/store/worker.slice";
import { refreshImages } from "@/store/images.slice";
import { BackendStatus } from '@/common/models/myapi.models';
import moment from 'moment';

interface MessageFormat {
    type: string
    data: string | object
}

let id: NodeJS.Timer
export default function GeneratorProgress() {
    Logger.debug('Rendering GeneratorProgress')
    const dispatch = useAppDispatch()
    const [progress, setProgress] = useState<BackendStatus>()

    const { lastMessage, readyState } = useWebSocket('ws://localhost:7999/ws', { shouldReconnect: () => true });

    useEffect(() => {
        if (!lastMessage) return
        let data = undefined
        try { data = JSON.parse(lastMessage.data) as MessageFormat } catch { Logger.warn(`Unable to parse websocket message '${lastMessage.data}'`) }
        if (!data) return
        Logger.debug('Message received', data)
        if (data.type === 'error') {
            dispatch(addMessage(data.data))
        }
        if (data.type === 'txt2img') {
            dispatch(refreshImages())
        }
        else if (data.type === 'info') {
            dispatch(addMessage(data.data))
        }
        else if (data.type === 'test') {
            dispatch(addMessage('[TEST]: ' + data.data))
        }
        else if (data.type === 'progress' && typeof data.data === 'object') {
            const newProgress = data.data as BackendStatus
            setProgress(newProgress)
        }
    }, [dispatch, lastMessage])

    const wsStatus = getStatus(readyState)
    useEffect(() => {
        Logger.debug('Websocket status changed to', wsStatus)
    }, [wsStatus])

    let inner;
    if (!progress) inner = <></>
    else if (!progress.running) inner = <div>Idle, {progress.tasks} tasks</div>
    else {
        const timeStared = moment(progress.started, 'YYYYMMDDHHmmss')
        const timeTaken = moment().diff(timeStared, 'seconds')
        const image = progress.image ? <img alt="Image being generated" src={'data:image/png;base64,' + progress.image} /> : <></>
        inner = (
            <Fragment>
                <div>Working, {progress.tasks} tasks, started {timeStared?.format('H:mm:ss')}</div>
                <div>{timeTaken} seconds elapsed</div>
                {progress.skipped ? <div>Skipping...</div> : <div>Progress: {progress.progress} %</div>}
                <div className="image-container">{image}</div>
            </Fragment>
        )
    }

    return <div className="progress-container">
        <span>{wsStatus}</span>
        {inner}
    </div>
}

const getStatus = function (readyState: ReadyState) {
    return {
        [ReadyState.CONNECTING]: 'Connecting',
        [ReadyState.OPEN]: 'Connected',
        [ReadyState.CLOSING]: 'Closing',
        [ReadyState.CLOSED]: 'Closed',
        [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState];
}