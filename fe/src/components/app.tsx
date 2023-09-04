'use client';
import React, { useCallback, useEffect, useState, useTransition } from 'react';
import classNames from 'classnames';

import { Logger } from '@common/logger';
import Options from './options'
import Gallery from './gallery';
import GeneratorProgress from './progress';
import Actions from './actions';
import { SdApi } from '@/services/sdapi.service';
import { Embedding, Lora } from '@/common/models/sdapi.models';

import { getSettings, useAppDispatch } from '@/store/store';

import config from '../../config.json'
import { AppActions } from '@/store/app.slice';
import { OptionActions } from '@/store/options.slice';
import Spotlight from './spotlight';
import ModelSampler from './modelsampler';

export default function App() {
    Logger.debug('Rendering App')
    const dispatch = useAppDispatch()

    const [showLoras, setShowLoras] = useState<boolean>()
    const [loras, setLoras] = useState<Lora[]>([])
    const [embeddings, setEmbeddings] = useState<Embedding[]>([])

    useEffect(() => {
        (async () => {
            const loras = await SdApi.getLoras()
            if (loras) setLoras(loras)
            const embs = await SdApi.getEmbeddings()
            if (embs) setEmbeddings(embs)
        })()
    }, [setLoras])

    const toggleLoras = useCallback(() => {
        setShowLoras(!showLoras)
    }, [loras, showLoras])

    function copyLora(l: Lora) {
        navigator.clipboard.writeText(`<lora:${l.alias ?? l.name}:1>`).then(() => Logger.debug('Copied lora', l.alias ?? l.name, 'to clipboard'))
    }

    const loraElements = loras.map(l => {
        const label = l.name === l.alias ? l.name : `${l.name} (alias: ${l.alias})`
        const loraDef = config.lora_definitions.find(t => t.name === l.name)
        let title = ''
        if (loraDef) {
            title = (loraDef.comment ? (loraDef.comment + '\n') : '') + loraDef.keywords.join(', ')
        }
        return <li key={l.name} title={title} onClick={() => copyLora(l)}>{label}</li>
    })
    const embedElements = embeddings.map(e => {
        return <li key={e.name}>{e.name}{e.skipped && ' (skipped)'}</li>
    })

    const loraClass = classNames({
        'hidden': !showLoras,
        'row': true
    })

    // init
    useEffect(() => {
        (async () => {
            const models = await SdApi.getModels()
            const samplers = await SdApi.getSamplers()
            const upscalers = await SdApi.getUpscalers()
            const sdoptions = await SdApi.getOptions()

            if (models) dispatch(AppActions.setModels(models.filter(m => !!m)))
            if (samplers) dispatch(AppActions.setSamplers(samplers))
            if (upscalers) dispatch(AppActions.setUpscalers(upscalers))
            if (sdoptions) dispatch(AppActions.setSdOptions(sdoptions))

            dispatch(getSettings())
        })()
    }, [dispatch])

    return (
        <div className="app">
            <div className="main-controls">
                <GeneratorProgress />
                <Options />
                <Actions />
            </div>
            <div className=''>
                <div onClick={() => toggleLoras()}>
                    Loras & Embeddings
                </div>
                <div className='row'>
                    <div className={loraClass}>
                        <div>Loras:</div>
                        <div>
                            <ul>
                                {loraElements}
                            </ul>
                        </div>
                    </div>
                    <div className={loraClass}>
                        <div>Embeddings:</div>
                        <div>
                            <ul>
                                {embedElements}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <Gallery />
            <Spotlight />
            <ModelSampler />
        </div>
    )
}
