'use client';
import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { Logger } from '@common/logger';
import Options from './options'
import Gallery from './gallery';
import GeneratorProgress from './progress';
import Actions from './actions';
import { SdApi } from '@/services/sdapi.service';
import { Embedding, Lora } from '@/common/models/sdapi.models';

import config from '../../config.json'
import classNames from 'classnames';

export default function App() {
    Logger.debug('Rendering App')

    const [ showLoras, setShowLoras ] = useState<boolean>()
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

    const loraElements = loras.map(l => {
        const label = l.name === l.alias ? l.name : `${l.name} (alias: ${l.alias})`
        const loraDef = config.lora_definitions.find(t => t.name === l.name)
        let title = ''
        if (loraDef) {
            title = (loraDef.comment ? (loraDef.comment + '\n') : '') + loraDef.keywords.join(', ')
        }
        return <li key={l.name} title={title}>{label}</li>
    })
    const embedElements = embeddings.map(e => {
        return <li key={e.name}>{e.name}{e.skipped && ' (skipped)'}</li>
    })

    const loraClass = classNames({
        'hidden': !showLoras
    })

    return (
        <div className="app">
            <div className="main-controls">
                <GeneratorProgress />
                <Options />
                <Actions />
            </div>
            <div className='row'>
                <div>
                    <div onClick={() => toggleLoras()}>Loras:</div>
                    <div className={loraClass}>
                        <ul>
                            {loraElements}
                        </ul>
                    </div>
                </div>
                <div>
                    <div onClick={() => toggleLoras()}>Embeddings:</div>
                    <div className={loraClass}>
                        <ul>
                            {embedElements}
                        </ul>
                    </div>
                </div>
            </div>
            <Gallery />
        </div>
    )
}
