'use client';
import axios from 'axios'

import { axiosInstance, tryGet, tryPost } from './common.services'
import { Embedding, EmbeddingResponse, Lora, Model, Sampler, Upscaler } from "@common/models/sdapi.models";
import { SdApiOptions } from "@common/models/option.models";
import { Logger } from '@/common/logger';

/*export default*/

const getModels = async () => {
    const result = await tryGet<Model[]>('/sdapi/v1/sd-models')
    return result ? result.sort((m1, m2) => m1.title.localeCompare(m2.title)) : null
}

const getSamplers = () => {
    return tryGet<Sampler[]>('/sdapi/v1/samplers')
}

const getUpscalers = () => {
    return tryGet<Upscaler[]>('/sdapi/v1/upscalers')
}

const getOptions = async () => {
    try {
        return (await axiosInstance.get<SdApiOptions>('/sdapi/v1/options')).data
    }
    catch (error) {
        if(axios.isAxiosError(error) && error.response) {
            const sdapierrpr = (error.response.data.errors as string) 
            if(sdapierrpr && sdapierrpr.includes('sd_model_checkpoint\n  value is not None')) {
                Logger.softError('Need to reset WebUI model options, probably a fresh WebUI install')
                Logger.warn('Launch normal WebUI (http://127.0.0.1:7860/) and hit Reload UI')
            }
            else Logger.softError(error)
        }
        else Logger.softError(error)
    }
}

const getLoras = () => {
    return tryGet<Lora[]>('/sdapi/v1/loras')
}

const getEmbeddings = async () => {
    const res = await tryGet<EmbeddingResponse>('/sdapi/v1/embeddings')
    if(!res) return undefined

    const embeddings: Embedding[] = []
    for(const key in res.loaded) {
        embeddings.push({ name: key, skipped: false })
    }
    for(const key in res.skipped) {
        embeddings.push({ name: key, skipped: true })
    }
    return embeddings
}

const setModel = async (model: Model) => {
    const payload = {
        sd_model_checkpoint: model.title
    } as SdApiOptions
    const response = await axiosInstance.post<SdApiOptions>('/sdapi/v1/options', payload)
    if (response.data && response.data.sd_model_checkpoint !== model.title) {
        throw new Error('Changing model resulted in options with different model: ' + model.title)
    }
}

const refreshModels = async () => {
    return tryPost<void>('/sdapi/v1/refresh-checkpoints')
}
const refreshLoras = async () => {
    return tryPost<void>('/sdapi/v1/refresh-loras')
}

const interrogate = async (imageUrl: string) => {
    const imageDataUri = await getImageAsDataUrl(imageUrl)
    return tryPost('/sdapi/v1/interrogate', { image: imageDataUri, model: 'clip' })
}

const skip = () => {
    return tryPost<string>('/sdapi/v1/skip')
}

export const SdApi = {
    getModels,
    getSamplers,
    getUpscalers,
    getOptions,
    getLoras, getEmbeddings,
    setModel,
    interrogate, skip,
    refreshModels,
    refreshLoras,
}

async function getImageAsDataUrl(url: string) {
    let blob = await fetch(url).then(r => r.blob());
    let dataUrl = await new Promise(resolve => {
      let reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
    return dataUrl
}