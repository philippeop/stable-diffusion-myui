import { Logger } from '../fe/src/common/logger.js'

export class Worker {
    running = false
    timer
    tasks: ActionTask[] = []
    onOneCompleted?: CallbackTask
    onLast?: CallbackTask
    constructor(interval = 2000) {
        this.timer = setInterval(this.act, interval)
    }

    public addTask(task: ActionTask) {
        Logger.log('Queued a task, in queue', this.tasks.length)
        this.tasks.push(task)
    }

    private act = () => {
        Logger.debug('[WORKER] Is', this.running ? 'busy,' : 'idle,', this.tasks.length, 'tasks to do')
        if (!this.tasks.length || this.running) return
        this.running = true
        const task = this.tasks.splice(0, 1)[0]
        
        task().then(() => {
            this.running = false
            if (this.onOneCompleted) this.onOneCompleted()
            if (!this.tasks.length && this.onLast) this.onLast()
        })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CallbackTask = () => Promise<void>
type ActionTask = () => Promise<void>