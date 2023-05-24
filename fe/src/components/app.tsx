'use client';
import React, { useEffect, useState } from 'react';
import { Logger } from '@common/logger';
import Options from './options'
import Gallery from './gallery';
import GeneratorProgress from './progress';
import Actions from './actions';
import { SdApi } from '@/services/sdapi.service';
import { Embedding, Lora } from '@/common/models/sdapi.models';

import config from '../../config.json' 

export default function App() {
    Logger.debug('Rendering App')

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

    const loraElements = loras.map(l => {
        const label = l.name === l.alias ? l.name : `${l.name} (alias: ${l.alias})`
        const configWords = config.lora_triggers.find(t => t.name === l.name)
        let title = ''
        if(configWords) {
            title = configWords.keywords.join(', ')
        }
        return <li key={l.name} title={title}>{label}</li>
    })
    const embedElements = embeddings.map(e => {
        return <li key={e.name}>{e.name}{e.skipped && ' (skipped)'}</li>
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
                    Loras:
                    <ul>
                        {loraElements}
                    </ul>
                </div>
                <div>
                    Embeddings:
                    <ul>
                        {embedElements}
                    </ul>
                </div>
            </div>
            <Gallery />
        </div>
    )
}
