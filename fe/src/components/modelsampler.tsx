'use client';
import {  useState } from 'react'

import { Logger } from '@common/logger';
import { useAppDispatch, useRootSelector } from '../store/store'
import Button from './button';
import { AppActions } from '@/store/app.slice';
import { MyApi } from '@/services/myapi.service';
import { ImageActions } from '@/store/images.slice';

export default function ModelSampler() {
    Logger.debug('Rendering ModelSampler')
    const dispatch = useAppDispatch()
    const options = useRootSelector((s) => s.options)
    const models = useRootSelector(s => s.app.models)
    const visible = useRootSelector(s => s.app.modelsamplervisible)
    const samplerOptions = useRootSelector(s => s.images.samplerOptions)

    const [all, setAll] = useState<boolean>(true)

    function setChecked(model_name: string, value: boolean) {
        if(value && !samplerOptions.includes(model_name)) 
            dispatch(ImageActions.setSamplerOptions([...samplerOptions, model_name]))
        else if(!value && samplerOptions.includes(model_name)) 
            dispatch(ImageActions.setSamplerOptions(samplerOptions.filter(m => m !== model_name)))
    }

    function go() {
        if(!samplerOptions.length) return
        const currentmodel = models.find(m => m.model_name == options.model)
        if (!currentmodel) throw new Error(`Couldn't find current model ${options.model}`)
        const selectedModels = models.filter(m => samplerOptions.includes(m.model_name))
        MyApi.sampleModels(options, selectedModels, currentmodel).then(() => {})
    }

    return !visible ? <></> : (
        <div className='model-sampler'>
            {/* <div><input type="checkbox" id="all" value="all" checked={all} onChange={(e) => setAll(e.currentTarget.checked)}/><label htmlFor="all">All</label></div> */}
            {models.map(m => <div><input type="checkbox" id={m.model_name} value={m.model_name} checked={samplerOptions.includes(m.model_name)} onChange={(e) => setChecked(m.model_name, e.currentTarget.checked)} /><label htmlFor={m.hash}>{m.title}</label></div>)}
            <div className='actions'>
                <Button onClick={() => go()}>Go</Button><Button onClick={() => dispatch(AppActions.setModelSamplerVisible(false))}>Close</Button>
            </div>
        </div>
    )
}