'use client';
import { useCallback } from "react";
import classNames from "classnames";

import { Logger } from "@common/logger";
import { SdApi } from '@/services/sdapi.service';
import { MyApi } from "@/services/myapi.service";
import { useAppDispatch, useRootSelector } from "@/store/store";
import { AppActions } from "@/store/app.slice";

export default function Actions() {
    Logger.debug('Rendering Actions')
    const dispatch = useAppDispatch()
    const working = useRootSelector((s) => s.app.working)
    const batches = useRootSelector((s) => s.app.batches)
    const options = useRootSelector((s) => s.options)
    const messages = useRootSelector((s) => s.app.messages)

    const submit = useCallback(() => {
        console.log('prompting with following options:', options)
        MyApi.txt2img(options, batches).then(() => dispatch(AppActions.setLastSent(options)))
        dispatch(AppActions.clearMessages())
    }, [dispatch, working, options, batches])

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