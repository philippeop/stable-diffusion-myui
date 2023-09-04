import { Txt2ImgOptions } from './option.models'
import { Model } from './sdapi.models'

export interface Txt2ImgPayload {
    options: Txt2ImgOptions
    batches: number
}

export interface UpscalePayload {
    options: Txt2ImgOptions
    model: Model
    currentmodel: Model
}

export interface SamplePayload {
    options: Txt2ImgOptions
    models: Model[]
    currentmodel: Model
}