import http from 'http'
import express, { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { Logger } from '../fe/src/common/logger.js'

import { MessagingService } from './server.messaging.js'
import { deleteAction, getImageAction, listImagesAction, txt2imgAction } from './server.actions.js'

const HOST = '127.0.0.1'
const PORT = 7999
export class Test {
    server
    app
    wss
    constructor() {
        Logger.log('Server starting up...')
        this.app = express()
        this.app.set('port', PORT);
        this.app.use(express.json())
        this.server = http.createServer(this.app)
        this.wss = new WebSocketServer({ server: this.server, path: "/ws" })
        this.wss.on('connection', this.onConnect)
        this.setupRouting()
        this.server.listen(PORT, HOST, () => {
            Logger.log(`Running on http://${HOST}:${PORT}`)
        })
    }

    onConnect(connection: WebSocket) {
        console.log('new connection', connection.readyState)
        //wss.emit('message', 'hello')
        connection.send('message hello')
        // ws.addEventListener('message', (message) => {
        //     console.log('ws message:', message.data);
        // })
    }

    setupRouting() {
        this.app.post('/myapi/v1/txt2img', (req, res) => wrap(txt2imgAction, req, res, this.wss))
        this.app.get('/myapi/img/:identifier', (req, res) => wrap(getImageAction, req, res, this.wss))
        this.app.get('/myapi/img', (req, res) => wrap(listImagesAction, req, res, this.wss))
        this.app.delete('/myapi/img/:identifier', (req, res) => wrap(deleteAction, req, res, this.wss))
    }
}

new Test()

function wrap(func: (req: Request, res: Response, msg: MessagingService) => void, req: Request, res: Response, wss: WebSocketServer) {
    func(req, res, new MessagingService(wss));
}