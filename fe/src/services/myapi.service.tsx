'use client';

import { debounce } from 'debounce'

import { Model } from '@/common/models/sdapi.models';
import { axiosInstance, tryGet, tryPost } from './common.services'
import { Txt2ImgResult } from "@common/models/myapi.models";
import { SavedSettings, Txt2ImgOptions } from "@common/models/option.models";
import { SamplePayload, Txt2ImgPayload, UpscalePayload } from '@/common/models/payload.models';

const list = async () => {
    return await tryGet<Txt2ImgResult[]>('/myapi/img') || []
}

const txt2img = (options: Txt2ImgOptions, batches: number) => {
    const optionsNow = { ...options }
    if(!options.upscale) {
        optionsNow.upscaler = 'None'
    }
    const payload = { options: optionsNow, batches } as Txt2ImgPayload
    return tryPost<void>('/myapi/txt2img', payload)
    // return tryGet('/myapi/test')
}

const upscale = (options: Txt2ImgOptions, model: Model, currentmodel: Model) => {
    const payload = { options, model, currentmodel } as UpscalePayload
    return tryPost<boolean>('/myapi/upscale', payload)
}

const sampleModels = (options: Txt2ImgOptions, models: Model[], currentmodel: Model) => {
    if (!models || !models.length) throw new Error('sampleModels, no models passed')
    if (!currentmodel) throw new Error('sampleModels, no currentmodel passed')
    options = { ...options }
    if(!options.upscale) {
        options.upscaler = 'None'
    }
    const payload = { options, models, currentmodel } as SamplePayload
    return tryPost<boolean>('/myapi/samplemodels', payload)
}

const tagImage = (image: Txt2ImgResult, type: number) => {
    if(!image) throw new Error('tagImage received undefined image')
    return tryGet<boolean>(`/myapi/tag/${type}/${image.name}`)
}

const moveImage = (image: string, after: string) => {
    if(!image) throw new Error('tagImage received undefined \'image\'')
    if(!after) throw new Error('tagImage received undefined \'after\'')
    return tryPost<boolean>('/myapi/img/move', { from: image, to: after })
}

const deleteImage = (image: Txt2ImgResult) => {
    try {
        return axiosInstance.delete('/myapi/img/' + image.name)
    }
    catch (e) {
        console.error('Unable to delete,', e)
    }
}

const getSettings = () => {
    return tryGet<SavedSettings>('/myapi/settings')
}

const saveSettings = (options: Txt2ImgOptions) => {
    const payload = { txt2img_options: options } as SavedSettings
    tryPost<never>('/myapi/settings', payload)
}


export const MyApi = {
    list,
    txt2img,
    upscale,
    sampleModels,
    tagImage,
    moveImage,
    deleteImage,
    getSettings,
    saveSettings: debounce(saveSettings, 500),
}