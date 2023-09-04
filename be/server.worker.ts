import { Logger } from '../fe/src/common/logger.js'

export class Worker {
    running = false
    timer
    tasks: Task[] = []
    onOneCompleted?: CallbackTask
    onLast?: CallbackTask
    constructor(interval = 2000) {
        this.timer = setInterval(this.act, interval)
    }

    public addTask(title: string, task: ActionTask) {
        Logger.log('Queued a', title, 'task, in queue', this.tasks.length)
        this.tasks.push({ title, action: task})
    }

    private act = () => {
        Logger.debug('[WORKER] Is', this.running ? 'busy,' : 'idle,', this.tasks.length, 'tasks to do')
        if (!this.tasks.length || this.running) return
        this.running = true
        const task = this.tasks[0]
        
        task.action().then(() => {
            this.tasks.splice(0, 1)
            this.running = false
            if (this.onOneCompleted) this.onOneCompleted(task.title)
            if (!this.tasks.length && this.onLast) this.onLast(task.title)
        })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Task {
    title: string
    action: ActionTask
}
type CallbackTask = (title: string) => Promise<unknown>
type ActionTask = () => Promise<unknown>