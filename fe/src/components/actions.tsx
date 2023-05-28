'use client';
import { useCallback, useEffect } from "react";
import classNames from "classnames";

import { Logger } from "@common/logger";
import { SdApi } from '@/services/sdapi.service';
import { MyApi } from "@/services/myapi.service";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { clearMessages } from "@/store/worker.slice";
import { setLastSend } from '@/store/options.slice';

export default function Actions() {
    Logger.debug('Rendering Actions')
    const dispatch = useAppDispatch()
    const working = useAppSelector((s) => s.worker.working)
    const options = useAppSelector((s) => s.options)
    const messages = useAppSelector((s) => s.worker.messages)

    const submit = useCallback(() => {
        const filteredOptions = { ... options, last_sent: undefined}
        console.log('prompting with following options:', filteredOptions)
        MyApi.txt2img(filteredOptions).then(() => dispatch(setLastSent(filteredOptions)))
        dispatch(clearMessages())
    }, [dispatch, working, options])

    function skip() {
        console.log('skipping')
        SdApi.skip().then()
    }

    const classesSubmit = classNames({
        'button': true
    })

    const classesSkip = classNames({
        'button': true,
        'positive': working,
        'negative': !working,
    })

    return (
        <div className="action-container">
            <div className="action-row">
                <div className={classesSubmit} onClick={submit}>Submit</div>
                <div className={classesSkip} onClick={skip}>Skip</div>
            </div>
            <div className="log">
                {messages.slice().map((m) => <div key={m}>{m}</div>)}
            </div>
        </div>
    )
}