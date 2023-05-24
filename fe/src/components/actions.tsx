'use client';
import { useCallback, useEffect } from "react";
import classNames from "classnames";

import { Logger } from "@common/logger";
import { SdApi } from '@/services/sdapi.service';
import { MyApi } from "@/services/myapi.service";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { setWorking } from "@/store/worker.slice";
import { setLastSend } from '@/store/options.slice';

let id: NodeJS.Timer
export default function Actions() {
    Logger.debug('Rendering Actions')
    const dispatch = useAppDispatch()
    const working = useAppSelector((s) => s.worker.working)
    const options = useAppSelector((s) => s.options)
    const messages = useAppSelector((s) => s.worker.messages)

    const submit = useCallback(() => {
        // if (working) return
        console.log('prompting with following options:', options)
        MyApi.txt2img(options).then(() => dispatch(setLastSend(options)) && dispatch(setWorking(true)))
    }, [dispatch, working, options])

    function skip() {
        if (!working) return
        console.log('skipping')
        SdApi.skip() //.then(() => dispatch(setWorking(true)))
    }

    useEffect(() => {
        if (!working) clearInterval(id)
    }, [working])

    const classesSubmit = classNames({
        'button': true,
        'working': working
    })

    const classesSkip = classNames({
        'button': true,
        'skip': true,
        'working': working,
    })

    return (
        <div className="action-container">
            <div className="action-row">
                <div className={classesSubmit} onClick={submit}>Submit</div>
                <div className={classesSkip} onClick={skip}>Skip</div>
            </div>
            {messages.slice().reverse().map((m) => <div key={m}>{m}</div>)}
        </div>
    )
}

// function validatePrompt(prompt: string) {

// }