import { MyUiOptions } from './option.models'

export interface Txt2ImgResult {
    name: string
    options: MyUiOptions
    timestamp: string
    /** REAL SEED */
    seed: number
}
