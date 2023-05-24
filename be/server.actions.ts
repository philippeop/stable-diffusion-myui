import fs from 'fs'
import fetch from 'node-fetch';
import { Request, Response } from 'express';

import { Logger } from './../fe/src/common/logger.js'
import { MyUiOptions } from "./../fe/src/common/models/option.models.js"
import { Txt2ImgResult } from "./../fe/src/common/models/myapi.models.js"
import { Txt2ImgResponse, Txt2ImgRequest, SdApiError } from "./../fe/src/common/models/sdapi.models.js"
import { ImageMetadata, MyUiDb } from './server.db.js'
import { MessagingService } from './server.messaging.js';

const WEBUI_URL = 'http://127.0.0.1:7861'
// const FE_URL = 'http://localhost:7999'

const db = new MyUiDb()
export const listImagesAction = (req: Request, res: Response) => {
    Logger.debug('listImagesAction')
    const images = db.data.images.map(imageMetadataToImageResult)
    res.status(200).send(images)
}

export const txt2imgAction = async (req: Request, res: Response, msg: MessagingService) => {
    const options = req.body as MyUiOptions
    if (!options) Logger.error('Received no options for txt2imgAction')
    res.status(200).send()
    
    msg.sendNotice(`Started, doing ${options.batches}x${options.image_count} generations`)

    const batches = options.batches ?? 1
    options.batches = 1
    const payload = optionsToRequest(options)

    for(let i = 0; i < (batches ?? 1); i++) {
        Logger.debug(`Doing batch ${i+1} / ${batches}`)
        const data = await oneTxt2Img(payload, msg)

        if (!data || !data.images) {
            Logger.warn('Txt2Img didnt result in images, probably ran out of memory')
            msg.sendTxt2ImgError('Txt2Img didnt result in images')
            break
        }

        Logger.debug(`Got ${data.images.length} images for batch ${i+1}, processing`)
        for (const [key, imageData] of data.images.entries()) {
            const name = saveImage(imageData)
            db.createImage(name, options, data.parameters, data.info)
            data.images[key] = `/myapi/img/${name}`
        }
        msg.sendTxt2ImgNewImage(i+1, batches)
    }

    msg.sendTxt2ImgDone()
}

async function oneTxt2Img(request: Txt2ImgRequest, msg: MessagingService) {
    if(request.n_iter !== 1) Logger.error('oneTxt2Img should be 1 iteration')
    let data: Txt2ImgResponse | undefined;
    try {
        const response = await fetch(`${WEBUI_URL}/sdapi/v1/txt2img`, {
            method: 'post',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(request)
        })

        if(response.ok) {
            data = await response.json() as Txt2ImgResponse
        }
        else {
            const error = await response.json() as SdApiError
            const txt = `WebUI error: ${error.error} ${error.errors}`
            msg.sendTxt2ImgError(txt)
            Logger.warn(txt)
        }
    }
    catch (e) {
        console.log('???')
        Logger.warn('Unable to connect to the A1111 API', e)
    }
    
    return data
}

export const getImageAction = (req: Request, res: Response) => {
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

export const deleteAction = (req: Request, res: Response, msg: MessagingService) => {
    const name = req.params['identifier']
    const path = `./imgs/${name}`
    const index = db.data.images.findIndex((i) => i.name === name)
    if (index >= 0 && fs.existsSync(path)) {
        Logger.log('Deleting entry name', name)
        db.data.images.splice(index, 1)
        db.save()
        Logger.log('Deleting file at', path)
        fs.rmSync(path)
        res.send()
        msg.sendImageDelete(name)
    }
    else {
        res.status(200).send({ message: 'Image not found ' + path })
    }
}

function optionsToRequest(options: MyUiOptions): Txt2ImgRequest {
    const request = {} as Txt2ImgRequest;
    Logger.debug('Prompt before:', JSON.stringify(options.prompt))
    Logger.debug('Negative before:', JSON.stringify(options.negative))
    request.prompt = options.prompt.replace(/ \n/g, ' ').replace(/\n/g, ' ')
    Logger.log('Prompt after:', JSON.stringify(request.prompt))
    Logger.log('Negative before:', JSON.stringify(options.negative))
    request.negative_prompt = options.negative.replace(/ \n/g, ' ').replace(/\n/g, ' ')
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
    request.restore_faces = false
    request.tiling = false
    request.styles = []
    request.batch_size = options.image_count || 1
    request.n_iter = options.batches || 1
    request.enable_hr = !!options.upscaler
    request.override_settings = { 'CLIP_stop_at_last_layers': options.clip_skip }
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

function saveImage(imageData: string): string {
    const folder = './imgs'
    if (!fs.existsSync(folder)) fs.mkdirSync(folder)
    const name = `${Date.now().toString(36)}.png`
    // More: randomStr = Math.random().toString(36).substring(2, 8)
    const path = `${folder}/${name}`;
    fs.writeFileSync(path, imageData, 'base64')
    return name
}

function imageMetadataToImageResult(meta: ImageMetadata): Txt2ImgResult {
    return {
        name: meta.name,
        options: meta.options,
        timestamp: meta.timestamp,
        seed: meta.seed
    }
}