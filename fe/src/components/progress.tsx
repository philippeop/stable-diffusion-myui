'use client';
import { Fragment, useEffect, useState } from "react"
import { NumericFormat } from "react-number-format"
import useWebSocket, { ReadyState } from "react-use-websocket";

import { useAppDispatch, useAppSelector } from "../store/store"
import { Logger } from '@common/logger';
import { addMessage, setWorking } from "@/store/worker.slice";
import { refreshImages } from "@/store/images.slice";
import { SdApi } from "@/services/sdapi.service";
import { Progress } from "@/common/models/sdapi.models";

interface MessageFormat {
    type: string
    data: string
}

let id: NodeJS.Timer
export default function GeneratorProgress() {
    Logger.debug('Rendering GeneratorProgress')
    const dispatch = useAppDispatch()
    const working = useAppSelector((s) => s.worker.working)
    const [progress, setProgress] = useState<Progress>()

    const { lastMessage, readyState } = useWebSocket('ws://localhost:7999/ws', { shouldReconnect: () => true });

    useEffect(() => {
        if (working) {
            id = setInterval(async () => {
                setProgress(await SdApi.getProgress())
                document.title = `Generating ${progress?.progress ?? 0 * 100}% - sd-myui`
            }, 2000)
        }
        else {
            document.title = 'Idle - sd-myui'
            clearInterval(id)
        }
    }, [working])

    useEffect(() => {
        if (working) {
            const perc = Math.round((progress?.progress ?? 0) * 100)
            document.title = `WIP ${perc}% - sd-myui`
        }
        else {
            document.title = 'Idle - sd-myui'
        }
    }, [working, progress])

    useEffect(() => {
        if (!lastMessage) return
        let data = undefined
        try { data = JSON.parse(lastMessage.data) as MessageFormat } catch { Logger.warn(`Unable to parse websocket message '${lastMessage.data}'`) }
        if (!data) return
        console.log('Message received', data)
        if (data.type === 'txt2img') {
            dispatch(refreshImages())
            dispatch(addMessage(data.data))
            if (data.data === 'Done') dispatch(setWorking(false))
        }
        else if (data.type === 'info') {
            dispatch(addMessage(data.data))
        }
        else if (data.type === 'test') {
            dispatch(addMessage('[TEST]: ' + data.data))
        }
    }, [dispatch, lastMessage])

    const wsStatus = getStatus(readyState)
    useEffect(() => {
        Logger.debug('Websocket status changed to', wsStatus)
    }, [wsStatus])

    const image = progress?.current_image ? <img alt="Image being generated" src={'data:image/png;base64,' + progress.current_image} /> : <></>

    const progressElement = !working ? <></> : (
        <Fragment>
            <div>Generating: {progress?.state.job_no} / {progress?.state.job_count}, {progress?.state.sampling_step} / {progress?.state.sampling_steps} samples</div>
            <div>Progress: <NumericFormat displayType='text' decimalScale={0} value={(progress?.progress ?? 0) * 100} />%</div>
            <div>ETA: <NumericFormat displayType='text' decimalScale={0} value={progress?.eta_relative} />s</div>
            <div className="image-container">{image}</div>
        </Fragment>
    )

    return <div className="progress-container">
        <span>{wsStatus}</span>
        {progressElement}
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