import fetch from 'node-fetch';
import fs from 'fs/promises';
import { Express, Request, Response } from 'express';

import { Progress } from "./../fe/src/common/models/sdapi.models.js"
import { Worker } from './server.worker.js'
import { MessagingService } from './server.messaging.js';
import { WEBUI_URL } from './server.actions.js';
import { Logger } from '../fe/src/common/logger.js';
import { BackendStatus } from '../fe/src/common/models/myapi.models.js';

export class ProgressPooler {
    worker: Worker
    msgs: MessagingService
    intervalTimer?: NodeJS.Timer
    lastImage?: Buffer

    constructor(app: Express, worker: Worker, msgs: MessagingService) {
        this.worker = worker
        this.msgs = msgs
        app.get('/myapi/progress/image', this.getProgressImage)
    }

    public start = () => {
        Logger.debug('[PROGRESSPOOLER] Started')
        this.intervalTimer = this.setupPooler()
    }

    private setupPooler = () => {
        return setInterval(async () => {
            Logger.debug('[PROGRESSPOOLER] Interval')
            const status = await this.buildBackendStatus()
            this.msgs.sendStatus(status)
        }, 2000)
    }

    private getProgress = async () => {
        try {
            const response = await fetch(`${WEBUI_URL}/sdapi/v1/progress`)
            if (!response.ok) return
            return await response.json() as Progress
        }
        catch (e) {
            Logger.warn('[PROGRESSPOOLER] Failed to get progress from webui,', e)
            return
        }
    }

    private buildBackendStatus = async () => {
        const status = {
            running: this.worker.running,
            tasks: this.worker.tasks.map(t => t.title)
        } as BackendStatus
        if(!this.worker.running) {
            return status
        }
        const progress = await this.getProgress()
        if(!progress) return status
        status.running = this.worker.running
        status.tasks = this.worker.tasks.map(t => t.title)
        status.progress = Math.round(progress.progress * 100)
        status.started = progress.state.job_timestamp
        status.skipped = progress.state.skipped || progress.state.interrupted
        if(progress.current_image) {
            const currentImageBuffer = Buffer.from(progress.current_image, 'base64')
            const same = this.lastImage && currentImageBuffer.compare(this.lastImage) === 0
            this.lastImage = currentImageBuffer
            status.refreshImage = same
        }
        return status
    }

    private getProgressImage = async (req: Request, res: Response) => {
        Logger.debug('getProgressImage')
        const path = `./imgs/progress.png`
        try {
            res.set('Content-Type', 'image/png')
            res.set('Content-Length', this.lastImage ? this.lastImage.length.toString() : '0')
            res.status(200).send(this.lastImage)
        }
        catch {
            res.status(500).send({ message: 'Progress image not found ' + path })
        }
    }
}