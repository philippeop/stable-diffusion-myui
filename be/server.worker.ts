import { Logger } from '../fe/src/common/logger.js'

export class Worker {
    running = false
    timer
    tasks: TaskWithParams[] = []
    onOneCompleted?: CallbackTask
    onLast?: CallbackTask
    constructor(interval = 2000) {
        this.timer = setInterval(this.act, interval)
    }

    public addTask(task: Task, params: TaskParam) {
        Logger.log('Queued a task, in queue', this.tasks.length)
        this.tasks.push({ task, params})
    }

    private act = () => {
        Logger.debug('[WORKER] Is', this.running ? 'busy,' : 'idle,', this.tasks.length, 'tasks to do')
        if (!this.tasks.length || this.running) return
        this.running = true
        const { task, params } = this.tasks.splice(0, 1)[0]
        
        task(params).then(() => {
            this.running = false
            if (!this.tasks.length && this.onLast) this.onLast()
        })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskParam = any
type CallbackTask = () => Promise<void>
type Task = (param: TaskParam) => Promise<void>
interface TaskWithParams {
    task: Task
    params: TaskParam
}