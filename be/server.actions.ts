import fs from 'fs'
import fetch from 'node-fetch';
import { Request, Response } from 'express';
import { WebSocketServer } from 'ws';

import { ImageMetadata, MyUiDb } from './server.db.js'
import { MessagingService } from './server.messaging.js';
import { Worker } from './server.worker.js'

import { Logger } from './../fe/src/common/logger.js'
import { MyUiOptions } from "./../fe/src/common/models/option.models.js"
import { Txt2ImgResult } from "./../fe/src/common/models/myapi.models.js"
import { Txt2ImgResponse, Txt2ImgRequest, SdApiError, Progress } from "./../fe/src/common/models/sdapi.models.js"

const WEBUI_URL = 'http://127.0.0.1:7861'
// const FE_URL = 'http://localhost:7999'

export class Actions {
    msgg: MessagingService
    db: MyUiDb
    worker: Worker
    constructor(wss: WebSocketServer) {
        this.db = new MyUiDb()
        this.msgg = new MessagingService(wss)
        this.worker = new Worker()
        this.worker.onOneCompleted = async () => {
            this.msgg.sendNotice(`Worker completed 1 task, ${this.worker.tasks.length} to go`)
        }
        this.worker.onLast = async () => this.msgg.sendTxt2ImgDone()

        setInterval(async () => {
            if (!this.worker.running) {
                this.msgg.sendProgress({
                    running: false,
                    tasks: this.worker.tasks.length
                })
            }
            else {
                const progress = await this.getProgress()
                if (!progress) return // should always be progress (even 0) if webui works
                this.msgg.sendProgress({
                    running: true,
                    tasks: this.worker.tasks.length,
                    progress: Math.round(progress.progress * 100),
                    started: progress.state.job_timestamp,
                    skipped: progress.state.skipped || progress.state.interrupted,
                    image: progress.current_image
                })
            }
        }, 2000)
    }

    public listImagesAction = (_: Request, res: Response) => {
        Logger.debug('listImagesAction')
        const images = this.db.listImages().map(this.imageMetadataToImageResult)
        res.status(200).send(images)
    }

    public txt2imgAction = async (req: Request, res: Response) => {
        Logger.debug('txt2imgAction')
        const options = req.body as MyUiOptions
        if (!options) Logger.error('Received no options for txt2imgAction')
        res.status(200).send()

        this.worker.addTask(() => this.handleTxt2ImgAction(options))
        this.msgg.sendNotice(`Queued prompt, ${this.worker.running ? 'working' : 'idle'}, ${this.worker.tasks.length} in queue`)
    }

    private handleTxt2ImgAction = async (options: MyUiOptions) => {
        this.msgg.sendNotice(`Started, doing ${options.batches} generations`)
        const batches = options.batches ?? 1
        options.batches = 1
        const payload = this.optionsToRequest(options)

        for (let i = 0; i < (batches ?? 1); i++) {
            Logger.debug(`Doing batch ${i + 1} / ${batches}`)
            const data = await this.oneTxt2Img(payload)

            if (!data || !data.images) {
                Logger.warn('Txt2Img didnt result in images, probably ran out of memory')
                this.msgg.sendTxt2ImgError('Txt2Img didnt result in images')
                break
            }

            Logger.debug(`Got ${data.images.length} images for batch ${i + 1}, processing`)
            for (const imageData of data.images) {
                await this.db.createImage(imageData, options, data.parameters, data.info)
            }
            this.msgg.sendTxt2ImgNewImage(i + 1, batches)
        }
    }

    private oneTxt2Img = async (request: Txt2ImgRequest) => {
        if (request.n_iter !== 1) Logger.error('oneTxt2Img should be 1 iteration')
        let data: Txt2ImgResponse | undefined;
        try {
            const response = await fetch(`${WEBUI_URL}/sdapi/v1/txt2img`, {
                method: 'post',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(request)
            })

            if (response.ok) {
                data = await response.json() as Txt2ImgResponse
            }
            else {
                const error = await response.json() as SdApiError
                const isOom = error.error === 'OutOfMemoryError'
                const errorMsg = isOom ? error.errors.split('If reserved memory is')[0] : error.errors
                const txt = `WebUI error: ${error.error} -- ${errorMsg}`
                this.msgg.sendTxt2ImgError(txt)
                Logger.warn(txt)
            }
        }
        catch (e) {
            console.log('???')
            Logger.warn('Unable to connect to the A1111 API', e)
        }

        return data
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
        
        if(!this.db.isValidType(type)) {
            this.msgg.sendNotice('Bad type received, ' + type)
            return res.status(400).send(false)
        }
        const typeNumber = +type
        await this.db.tagImage(name, typeNumber)
        this.msgg.sendNotice(`Tagged ${name} with type ${type}`)
        res.status(200).send(true)
    }

    public deleteAction = async (req: Request, res: Response) => {
        const name = req.params['identifier']
        Logger.debug('getImageAction', name)
        const path = `./imgs/${name}`
        
        try {
            const success = await this.db.deleteImage(name)
            if(!success) {
                this.msgg.sendNotice(`Can't delete image ${name}`)
                res.status(400).send(false)
                return 
            }
            Logger.log('Deleting file at', path)
            if (fs.existsSync(path)) fs.rmSync(path)
            this.msgg.sendImageDelete(name)
            res.status(200).send()
        }
        catch (err) {
            Logger.softError('Unable to delete image', name, 'from database,', err)
            res.status(500).send()
        }
    }

    private getProgress = async () => {
        const response = await fetch(`${WEBUI_URL}/sdapi/v1/progress`)
        if (!response.ok) return
        return await response.json() as Progress
    }

    private optionsToRequest = (options: MyUiOptions): Txt2ImgRequest => {
        const request = {} as Txt2ImgRequest;
        request.prompt = options.prompt.replace(/ \n/g, ' ').replace(/\n/g, ' ')
        request.negative_prompt = options.negative.replace(/ \n/g, ' ').replace(/\n/g, ' ')
        // Logger.debug('Prompt before:', JSON.stringify(options.prompt))
        // Logger.debug('Negative before:', JSON.stringify(options.negative))
        // Logger.log('Prompt after:', JSON.stringify(request.prompt))
        // Logger.log('Negative before:', JSON.stringify(options.negative))
        if (options.sampler) request.sampler_name = options.sampler;
        if (options.sampler) request.sampler_index = options.sampler;
        request.steps = options.steps;
        request.save_images = false;
        request.send_images = true;
        request.height = options.image_height || 512;
        request.width = options.image_width || 512;
        request.cfg_scale = options.cfg_scale;
        request.seed = +options.seed || -1
        request.subseed = -1
        request.subseed_strength = 0
        request.restore_faces = options.restore_faces
        request.tiling = false
        request.styles = []
        request.batch_size = 1
        request.n_iter = options.batches || 1
        request.enable_hr = !!options.upscaler && options.upscaler !== 'None'
        request.override_settings = {
            'CLIP_stop_at_last_layers': options.clip_skip,
            'eta_noise_seed_delta': options.ensd ?? 0
        }
        if (options.upscaler) {
            request.hr_upscaler = options.upscaler
            request.hr_scale = options.upscaler_scale
            request.hr_resize_x = request.width * options.upscaler_scale
            request.hr_resize_y = request.height * options.upscaler_scale
            request.hr_second_pass_steps = options.upscaler_steps
        }

        request.denoising_strength = options.upscaler_denoise
        return request
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
