'use client';
import { Logger } from "@common/logger";
import { MyApi } from "../services/myapi.service";
import { useAppDispatch, useAppSelector } from "../store/store";
import { setWorking } from "../store/worker.slice";
import classNames from "classnames";
import { setLastSend } from '@/store/options.slice';

let id: NodeJS.Timer
export default function Actions() {
    Logger.debug('Rendering Actions')
    const dispatch = useAppDispatch()
    const working = useAppSelector((s) => s.worker.working)
    const options = useAppSelector((s) => s.options)
    const messages = useAppSelector((s) => s.worker.messages)

    function submit() {
        if(working) return
        console.log('prompting with following options:', options)
        MyApi.txt2img(options).then(() => dispatch(setLastSend(options)) && dispatch(setWorking(true)))
    }

    useEffect(() => {
        if(!working) clearInterval(id)
    }, [working])

    const classes = classNames({
        'button': true,
        'working': working
    })

    return (
        <div className="action-container">
            <div className={classes} onClick={submit}>Submit</div>
            { messages.slice().reverse().map((m) => <div key={m}>{m}</div>) }
        </div>
    )
}

// function validatePrompt(prompt: string) {

// }