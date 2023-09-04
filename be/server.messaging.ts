import { WebSocketServer } from "ws";

import { Logger } from "../fe/src/common/logger.js";
import { BackendStatus } from '../fe/src/common/models/myapi.models.js';

export class MessagingService {
    private socket: WebSocketServer;
    constructor(socket: WebSocketServer)  {
        this.socket = socket
    }
    public setServer(socket: WebSocketServer) {
        this.socket = socket;
    }

    public sendNotice(msg: string) {
        this.send('info', msg)
    }

    public sendTxt2ImgNewImage(count: number, total: number, model: string) {
        this.send('txt2img', { count, total, model })
    }

    public sendTxt2ImgError(error: string) {
        this.send('error', error)
    }

    public sendImageDelete(name: string) {
        this.send('delete', name)
    }

    public sendTagged(name: string, type: number) {
        this.send('tagged', { name, type })
    }

    public sendStatus(status: BackendStatus) {
        this.send('progress', status)
    }

    public send(type: string, data: unknown) {
        if (!this.socket) return;
        Logger.debug('messaging', type, JSON.stringify(data));
        const payload = JSON.stringify({ type, data });
        this.socket.clients.forEach((ws) => {
            ws.send(payload);
        });
    }
}