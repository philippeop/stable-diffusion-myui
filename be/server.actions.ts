import fs from 'fs'
import fetch from 'node-fetch';
import { Request, Response } from 'express';
import { WebSocketServer } from 'ws';

import { ImageMetadata, MyUiDb } from './server.db.js'
import { MessagingService } from './server.messaging.js';
import { Worker } from './server.worker.js'

import { Logger } from './../fe/src/common/logger.js'
import { Txt2ImgResult } from "./../fe/src/common/models/myapi.models.js"
import { Txt2ImgPayload, UpscalePayload, SamplePayload } from "./../fe/src/common/models/payload.models.js"
import { Txt2Img } from './server.txt2img.js';
import { SavedSettings } from '../fe/src/common/models/option.models.js';
import { ProgressPooler } from './server.progress.js';

export const WEBUI_URL = 'http://127.0.0.1:7861'
// const FE_URL = 'http://localhost:7999'

export class Actions {
    msgs: MessagingService
    db: MyUiDb
    worker: Worker
    txt2img: Txt2Img
    progressPooler: ProgressPooler

    constructor(wss: WebSocketServer) {
        this.db = new MyUiDb()
        this.msgs = new MessagingService(wss)
        this.worker = new Worker()
        this.worker.onOneCompleted = async () => {
            this.msgs.sendNotice(`Worker completed 1 task, ${this.worker.tasks.length} to go`)
        }
        //this.worker.onLast = async () => this.msgg.sendTxt2ImgDone()
        this.txt2img = new Txt2Img(this.db, this.msgs)
        this.progressPooler = new ProgressPooler(this.worker, this.msgs);
        this.progressPooler.start()
    }

    public listImagesAction = (_: Request, res: Response) => {
        Logger.debug('listImagesAction')
        const images = this.db.listImages().map(this.imageMetadataToImageResult)
        res.status(200).send(images)
    }

    public txt2imgAction = async (req: Request, res: Response) => {
        Logger.debug('txt2imgAction')
        const payload = req.body as Txt2ImgPayload
        if (!payload || !payload.options) Logger.error('Received no options for txt2imgAction')
        res.status(200).send()

        for (let i = 0; i < (payload.batches ?? 1); i++) {
            this.worker.addTask('Txt2Img', async () => await this.txt2img.oneTxt2Img(payload.options))
        }
        this.msgs.sendNotice(`Queued prompt, ${this.worker.running ? 'working' : 'idle'}, ${this.worker.tasks.length} in queue`)
    }

    public upscaleAction = async (req: Request, res: Response) => {
        Logger.debug('upscaleAction')
        const { options, model, currentmodel } = req.body as UpscalePayload
        if (!options) Logger.error('Received no options for upscaleAction')
        res.status(200).send()

        if(currentmodel.hash !== model.hash) this.worker.addTask(`Switching to model ${model.model_name}`, async () => await this.setModel(model.title))
        this.worker.addTask('Upscaling', async () => await this.txt2img.oneTxt2Img(options))
        if(currentmodel.hash !== model.hash) this.worker.addTask(`Switching back to current model ${model.model_name}`, async () => await this.setModel(currentmodel.title))

        this.msgs.sendNotice(`Queued prompt, ${this.worker.running ? 'working' : 'idle'}, ${this.worker.tasks.length} in queue`)
    }

    public sampleModelsAction = async (req: Request, res: Response) => {
        Logger.debug('sampleModelsAction')
        const { options, models, currentmodel } = req.body as SamplePayload
        if (!options) Logger.error('Received no options for sampleModelsAction')
        if (!models || !models.length) Logger.error('Received no models for sampleModelsAction')
        res.status(200).send()

        for (const model of models) {
            this.worker.addTask(`Switching to model ${model.model_name}`, async () => await this.setModel(model.title))
            this.worker.addTask(`Sampling model ${model.model_name}`,async () => await this.txt2img.oneTxt2Img({ ...options, model: model.model_name }))
        }
        this.worker.addTask(`Switching back to current model ${currentmodel.model_name}`, async () => await this.setModel(currentmodel.title))

        this.msgs.sendNotice(`Queued model sampler tasks, ${this.worker.running ? 'working' : 'idle'}, ${this.worker.tasks.length} in queue`)
    }

    public getImageAction = (req: Request, res: Response) => {
        // Logger.debug('getImageAction')
        const name = req.params.identifier
        const path = `./imgs/${name}`
        if (fs.existsSync(path)) {
            const buffer = fs.readFileSync(path)
            res.set('Content-Type', 'image/png');
            res.set('Content-Length', buffer ? buffer.length.toString() : '0');
            res.status(200).send(buffer);
        }
        else {
            res.status(500).send({ message: 'Image not found ' + path })
        }
    }

    public tagImageAction = async (req: Request, res: Response) => {
        const type = req.params['type']
        const name = req.params['identifier']
        Logger.debug('tagImageAction', name, type)

        if (!this.db.isValidType(type)) {
            this.msgs.sendNotice('Bad type received, ' + type)
            return res.status(400).send(false)
        }
        const typeNumber = +type
        await this.db.tagImage(name, typeNumber)
        this.msgs.sendNotice(`Tagged ${name} with type ${type}`)
        res.status(200).send(true)
    }

    public moveImageAction = async (req: Request, res: Response) => {
        const { from, to } = req.body as { from: string, to: string }
        Logger.debug('moveImageAction', from, to)
        await this.db.moveImage(from, to)
        this.msgs.sendNotice(`Moved ${from} after ${to}`)
        res.status(200).send(true)
    }

    public deleteAction = async (req: Request, res: Response) => {
        const name = req.params['identifier']
        Logger.debug('getImageAction', name)
        const path = `./imgs/${name}`

        try {
            const success = await this.db.deleteImage(name)
            if (!success) {
                this.msgs.sendNotice(`Can't delete image ${name}`)
                res.status(400).send(false)
                return
            }
            Logger.log('Deleting file at', path)
            if (fs.existsSync(path)) fs.rmSync(path)
            this.msgs.sendImageDelete(name)
            res.status(200).send()
        }
        catch (err) {
            Logger.softError('Unable to delete image', name, 'from database,', err)
            res.status(500).send()
        }
    }

    public getSettingsAction = async (req: Request, res: Response) => {
        Logger.debug('getSettingsAction')
        const settings = this.db.getSettings()
        res.status(200).send(settings)
    }

    public saveSettingsAction = async (req: Request, res: Response) => {
        Logger.debug('saveSettingsAction')
        const payload = req.body as SavedSettings
        await this.db.saveSettings(payload.txt2img_options)
        res.status(200).send()
    }

    private setModel = async (model_title: string) => {
        const response = await fetch(`${WEBUI_URL}/sdapi/v1/options`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sd_model_checkpoint: model_title })
        })
        if (!response.ok) { Logger.error('Failed switching to model', model_title) }
        return response.ok
    }

    private imageMetadataToImageResult = (meta: ImageMetadata): Txt2ImgResult => {
        return {
            name: meta.name,
            options: meta.options,
            timestamp: meta.timestamp,
            seed: meta.seed,
            tag: meta.tag
        }
    }
}