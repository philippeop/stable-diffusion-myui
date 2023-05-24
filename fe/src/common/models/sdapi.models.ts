
export type { default as Txt2ImgResponse } from './Txt2ImgResponse'
export type { default as Txt2ImgRequest } from './Txt2ImgRequest'

export interface SdApiError {
    error: string
    detail: string
    body: string
    errors: string
}

export interface Sampler {
    name: string;
}

export interface Model {
    title: string
    model_name: string
    hash: string
    sha256: string
    filename: string
    config: string
}

export interface Upscaler {
    name: string
    model_name: string
    model_path: string
    model_url: string
    scale: number
}

export interface Progress {
    progress: number
    eta_relative: number
    state: State
    current_image: string
    textinfo: string
}

export interface Lora {
    name: string
    alias: string
    //path: string
    //metadata: Metadata
}

export interface State {
    skipped: boolean
    interrupted: boolean
    job: string
    job_count: number
    job_timestamp: string
    job_no: number
    sampling_step: number
    sampling_steps: number
}

export interface Embedding {
    name: string
    skipped: boolean
}

export interface EmbeddingResponse {
    loaded: EmbeddingList,
    skipped: EmbeddingList,
}

interface EmbeddingList {
    [key: string]: EmbeddingDefinition
}

interface EmbeddingDefinition {
    step: any
    sd_checkpoint: any
    sd_checkpoint_name: any
    shape: number
    vectors: number
}