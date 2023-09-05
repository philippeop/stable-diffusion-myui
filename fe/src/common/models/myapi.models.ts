import { Txt2ImgOptions } from './option.models'

export interface Txt2ImgResult {
    name: string
    options: Txt2ImgOptions
    timestamp: string
    /** REAL SEED */
    seed: number
    tag: number
    timeTaken?: number
}

export interface BackendStatus {
    running: boolean
    tasks: string[]
    progress?: number
    started?: string
    skipped?: boolean
    refreshImage?: boolean
  }
