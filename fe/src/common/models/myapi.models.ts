import { MyUiOptions } from './option.models'

export interface Txt2ImgResult {
    name: string
    options: MyUiOptions
    timestamp: string
    /** REAL SEED */
    seed: number
}

export interface BackendStatus {
    running: boolean
    tasks: number
    progress?: number
    started?: string
    skipped?: boolean
    image?: string
  }
