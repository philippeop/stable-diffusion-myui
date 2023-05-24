import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { Logger } from "./../fe/src/common/logger.js"
import { MyUiOptions } from "./../fe/src/common/models/option.models.js"
import { Txt2ImgInfo, Txt2ImgParameters } from "./../fe/src/common/models/Txt2ImgResponse.js"

// db
interface Data {
    images: ImageMetadata[]
}
export interface ImageMetadata {
    name: string
    timestamp: string // YYYYMMDDhhmmss
    seed: number
    options: MyUiOptions
    original_parameters: Txt2ImgParameters
    original_info: Txt2ImgInfo
}

export class MyUiDb {
    private db: Low<Data>;
    constructor() {
        const defaultData: Data = { images: [] }
        const adapter = new JSONFile<Data>('db.json')
        this.db = new Low<Data>(adapter, defaultData)
        this.loadAndUpgrade()
    }

    public get data(): Data {
        return this.db.data;
    }

    async save() {
        try {
            await this.db.write()
        }
        catch (e) {
            Logger.error('Failed writing to DB', e)
        }
    }

    async load() {
        await this.db.read()
    }

    async loadAndUpgrade() {
        await this.load()
        for(const i of this.db.data.images) {
            delete i.options["last_sent"]
            delete i.options["image_count"]
        }
        Logger.log('Upgraded', this.db.data.images.length, 'images')
        await this.save()
    }

    async createImage(name: string, options: MyUiOptions, params: Txt2ImgParameters, info: string) {
        const original_info = this.convertAndFilterInfo(info)
        this.db.data.images.push({ 
            name, 
            options,
            seed: original_info.seed,
            timestamp: original_info.job_timestamp, 
            original_parameters: params, 
            original_info })
        this.save()
    }

    private convertAndFilterInfo(info: string): Txt2ImgInfo {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const infoObj = JSON.parse(info) as any
        delete infoObj.prompt
        delete infoObj.negative_prompt
        delete infoObj.all_seeds
        delete infoObj.all_subseeds
        delete infoObj.all_prompts
        delete infoObj.all_negative_prompts
        delete infoObj.infotexts
        return infoObj as Txt2ImgInfo;
    }
}