import fetch from 'node-fetch';

import { Logger } from '../fe/src/common/logger.js'
import { SdApiError, Txt2ImgRequest, Txt2ImgResponse } from '../fe/src/common/models/sdapi.models.js'
import { WEBUI_URL } from './server.actions.js'
import { MyUiDb } from './server.db.js'
import { MessagingService } from './server.messaging.js'
import { Txt2ImgOptions } from '../fe/src/common/models/option.models.js';

export class Txt2Img {
    private db
    private msgg
    constructor(db: MyUiDb, msgg: MessagingService) {
        this.db = db
        this.msgg = msgg
    }

    public oneTxt2Img = async (options: Txt2ImgOptions) => {
        Logger.debug('oneTxt2Img')
        this.msgg.sendNotice(`Started, doing 1 generation`)
        const { request, count } = this.convertOptionsToRequestCount(options)
        if(!request) return

        Logger.debug(`Doing single image`)
        const data = await this.internalTxt2Img(request)
        if(!data) return

        Logger.debug(`Got ${data.images.length} image for single txt2img, processing`)
        this.saveResult(data, options)
        this.msgg.sendTxt2ImgNewImage(1, count, options.model)
    }

    private convertOptionsToRequestCount(options: Txt2ImgOptions, batches = 1) {
        try {
            return { request: this.optionsToRequest(options, batches), count: batches }
        }
        catch (e) {
            this.msgg.sendTxt2ImgError('Error converting options: ' + (e as Error).message)
            return { }
        }
    }

    private internalTxt2Img = async (request: Txt2ImgRequest) => {
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
                if (!data || !data.images) {
                    Logger.warn('Txt2Img didnt result in images, probably ran out of memory')
                    this.msgg.sendTxt2ImgError('Txt2Img didnt result in images')
                    return
                }
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

    private async saveResult(data: Txt2ImgResponse, options: Txt2ImgOptions) {
        for (const imageData of data.images) {
            await this.db.createImage(imageData, options, data.parameters, data.info)
        }
    }

    private optionsToRequest = (options: Txt2ImgOptions, batches?: number): Txt2ImgRequest => {
        const error = this.checkOptions(options)
        if (error) throw new Error(error)
        const request = {} as Txt2ImgRequest;
        request.prompt = this.sanitizePrompt(options.prompt)
        request.negative_prompt = this.sanitizePrompt(options.negative)
        // Logger.debug('Prompt before:', JSON.stringify(options.prompt))
        // Logger.debug('Negative before:', JSON.stringify(options.negative))
        // Logger.log('Prompt after:', JSON.stringify(request.prompt))
        // Logger.log('Negative before:', JSON.stringify(options.negative))
        if (options.sampler) request.sampler_name = options.sampler;
        if (options.sampler) request.sampler_index = options.sampler;
        request.steps = options.steps;
        request.save_images = false;
        request.send_images = true;
        request.height = options.image_height
        request.width = options.image_width
        request.cfg_scale = options.cfg_scale;
        request.seed = options.seed || -1
        request.subseed = -1
        request.subseed_strength = 0
        request.restore_faces = !!options.restore_faces
        request.tiling = false
        request.styles = []
        request.batch_size = 1
        request.n_iter = batches || 1
        request.enable_hr = !!options.upscaler && options.upscaler !== 'None'
        request.override_settings = {
            'CLIP_stop_at_last_layers': options.clip_skip,
            'eta_noise_seed_delta': options.ensd || undefined
        }
        if (options.upscaler) {
            request.hr_upscaler = options.upscaler
            request.hr_scale = options.upscaler_scale
            request.hr_resize_x = request.width * options.upscaler_scale
            request.hr_resize_y = request.height * options.upscaler_scale
            request.hr_second_pass_steps = options.upscaler_steps
            request.denoising_strength = options.upscaler_denoise
        }

        return request
    }

    private checkOptions(options: Txt2ImgOptions) {
        if (!options.prompt.length) return 'prompt' 
        const patt = /\)\s+\(/g;
        if (patt.test(options.prompt)) return 'prompt whitespace'
        if (!options.steps) return 'steps'
        if (typeof options.seed !== 'number') return 'seed'
        if (typeof options.restore_faces !== 'boolean') return 'restore_faces'
        if (typeof options.cfg_scale !== 'number' ||options.cfg_scale < 1 || options.cfg_scale > 10) return 'cfg_scale'
        if (typeof options.image_height !== 'number' || options.image_height < 100) return 'image_height'
        if (typeof options.image_width !== 'number' || options.image_width < 100) return 'image_width'
        if (typeof options.upscaler_scale !== 'number' || options.upscaler_scale < 1) return 'upscaler_scale'
        if (typeof options.upscaler_steps !== 'number' || options.upscaler_steps < 1) return 'upscaler_steps'
        if (typeof options.upscaler_denoise !== 'number' || options.upscaler_denoise < 0 || options.upscaler_denoise > 1) return 'upscaler_denoise'
    }
    
    private sanitizePrompt(prompt: string) {
        return prompt
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
    }
}