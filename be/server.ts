import http from 'http'
import express from 'express';
import { WebSocketServer } from 'ws';
import { Logger } from '../fe/src/common/logger.js'

import { Actions } from './server.actions.js'

const HOST = '127.0.0.1'
const PORT = 7999
export class Main {
    server
    app
    wss
    actions
    constructor() {
        Logger.log('Server starting up...')
        this.app = express()
        this.app.set('port', PORT);
        this.app.use(express.json())
        this.server = http.createServer(this.app)
        this.wss = new WebSocketServer({ server: this.server, path: "/ws" })
        this.wss.on('connection', this.onConnect)
        this.actions = new Actions(this.wss)
        this.setupRouting()
        this.server.listen(PORT, HOST, () => {
            Logger.log(`Running on http://${HOST}:${PORT}`)
        })
    }

    onConnect(connection: WebSocket, req: http.IncomingMessage) {
        Logger.log('[WebSocket] New connection from', req.socket.remoteAddress)
        connection.onclose = (() => { 
            Logger.log('[WebSocket] Disconnection:', req.socket.remoteAddress)
         })
    }

    setupRouting() {
        this.app.post('/myapi/txt2img', this.actions.txt2imgAction)
        this.app.post('/myapi/samplemodels', this.actions.sampleModelsAction)
        this.app.post('/myapi/upscale', this.actions.upscaleAction)
        this.app.get('/myapi/img/:identifier', this.actions.getImageAction)
        this.app.get('/myapi/img', this.actions.listImagesAction)
        this.app.get('/myapi/tag/:type/:identifier', this.actions.tagImageAction)
        this.app.post('/myapi/img/move', this.actions.moveImageAction)
        this.app.delete('/myapi/img/:identifier', this.actions.deleteAction)

        this.app.get('/myapi/settings', this.actions.getSettingsAction)
        this.app.post('/myapi/settings', this.actions.saveSettingsAction)
        // this.app.get('/myapi/test/:value', (req, res) => { 
        //     const value = req.params['value']
        //     res.status(200).send()
        //     Logger.log('Received', value)
        //     setTimeout(() => {
        //         Logger.log('Timeout value is', value)
        //     }, 10000)
        // })
    }
}

new Main()