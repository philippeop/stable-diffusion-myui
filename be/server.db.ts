import fs from 'fs'
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

    async save(note = '') {
        try {
            await this.db.write()
        }
        catch (e) {
            await this.db.read()
            Logger.softError('Failed writing to DB', note, e)
        }
    }

    async load() {
        await this.db.read()
    }

    async loadAndUpgrade() {
        await this.load()
        // for(const i of this.db.data.images) {
        //     delete i.options["last_sent"]
        //     delete i.options["image_count"]
        // }
        // Logger.log('Upgraded', this.db.data.images.length, 'images')
        // await this.save()
    }

    listImages() {
        return this.db.data.images
    }

    async createImage(imageData: string, options: MyUiOptions, params: Txt2ImgParameters, info: string) {
        const name = this.saveImage(imageData)
        const original_info = this.convertAndFilterInfo(info)
        this.db.data.images.push({
            name,
            options,
            seed: original_info.seed,
            timestamp: original_info.job_timestamp,
            original_parameters: params,
            original_info
        })
        await this.save('createImage')
    }

    private saveImage = (imageData: string): string => {
        const folder = './imgs'
        if (!fs.existsSync(folder)) fs.mkdirSync(folder)
        const name = `${Date.now().toString(36)}.png`
        // More: randomStr = Math.random().toString(36).substring(2, 8)
        const path = `${folder}/${name}`;
        fs.writeFileSync(path, imageData, 'base64')
        return name
    }

    async deleteImage(name: string) {
        Logger.log('Deleting entry name', name)
        const index = this.db.data.images.findIndex((i) => i.name === name)
        this.db.data.images.splice(index, 1)
        await this.save('deleteImage')
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