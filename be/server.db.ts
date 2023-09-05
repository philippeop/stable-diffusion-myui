import fs from 'fs'
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { Logger } from "./../fe/src/common/logger.js"
import { SavedSettings, Txt2ImgOptions, default_options } from "./../fe/src/common/models/option.models.js"
import { Txt2ImgInfo, Txt2ImgParameters } from "./../fe/src/common/models/Txt2ImgResponse.js"
import { arrayMoveMutable } from 'array-move'

// db
interface Data {
    images: ImageMetadata[]
}
export interface ImageMetadata {
    name: string
    timestamp: string // YYYYMMDDhhmmss
    seed: number
    timeTaken?: number
    options: Txt2ImgOptions
    original_parameters: Txt2ImgParameters
    original_info: Txt2ImgInfo
    tag: number
}

export class MyUiDb {
    private db: Low<Data>;
    private settings: Low<SavedSettings>;
    constructor() {
        const dataAdapter = new JSONFile<Data>('db.json')
        const settingsAdapter = new JSONFile<SavedSettings>('db.settings.json')
        this.db = new Low<Data>(dataAdapter, { images: [] })
        this.settings = new Low<SavedSettings>(settingsAdapter, {
            txt2img_options: default_options
        })
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
        await this.settings.read()
    }

    async loadAndUpgrade() {
        await this.load()
        // let counter = 0
        // for(const i of this.db.data.images) {
        //     counter++
        // }
        // Logger.log('Upgraded', counter, 'images')
        // await this.save()
    }

    listImages() {
        return this.db.data.images
    }

    async createImage(imageData: string, options: Txt2ImgOptions, params: Txt2ImgParameters, info: string, timeTaken: number) {
        const name = this.saveImage(imageData)
        const original_info = this.convertAndFilterInfo(info)
        this.db.data.images.push({
            name,
            options,
            seed: original_info.seed,
            timeTaken,
            timestamp: original_info.job_timestamp,
            original_parameters: params,
            original_info,
            tag: 0
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

    async tagImage(name: string, type: number) {
        const image = this.db.data.images.find(i => i.name === name)
        if (!image) { Logger.error('Image', name, 'not found'); return }
        if (!this.isValidType(type)) Logger.error('Type', type, 'unexpected')
        image.tag = type
        await this.save('tagImage')
    }

    async moveImage(from: string, to: string) {
        const fromIndex = this.db.data.images.findIndex(i => i.name === from)
        const toIndex = this.db.data.images.findIndex(i => i.name === to)
        // moves 'from' image after 'to' images
        // moveImage(b,c) [a,b,c,d] => [a,c,b,d]
        arrayMoveMutable(this.db.data.images, fromIndex, toIndex)
        await this.save()
        const fromIndex2 = this.db.data.images.findIndex(i => i.name === from)
        const toIndex2 = this.db.data.images.findIndex(i => i.name === to)
        Logger.log(fromIndex, toIndex, 'became', fromIndex2, toIndex2)
    }

    async deleteImage(name: string) {
        Logger.log('Deleting entry name', name)
        const index = this.db.data.images.findIndex((i) => i.name === name)
        const image = this.db.data.images[index]
        if (image.tag > 0) {
            Logger.debug('Tried to delete tagged image', name)
            return false
        }
        this.db.data.images.splice(index, 1)
        await this.save('deleteImage')
        return true
    }

    public getSettings() {
        return this.settings.data
    }

    public async saveSettings(options: Txt2ImgOptions) {
        this.settings.data.txt2img_options = options
        await this.settings.write()
    }

    public isValidType(type: string | number) {
        if (typeof type === 'string') return ['0', '1', '2'].includes(type)
        return [0, 1, 2].includes(type)
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