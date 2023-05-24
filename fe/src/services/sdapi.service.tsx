'use client';
import { axiosInstance, tryGet } from './common.services'
import { Embedding, EmbeddingResponse, Lora, Model, Progress, Sampler, Upscaler } from "@common/models/sdapi.models";
import { SdApiOptions } from "@common/models/option.models";
import { Logger } from '@/common/logger';
import axios from 'axios';

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

const getProgress = () => {
    return tryGet<Progress>('/sdapi/v1/progress')
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

export const SdApi = {
    getModels,
    getSamplers,
    getUpscalers,
    getOptions,
    getProgress,
    getLoras, getEmbeddings,
    setModel,
}