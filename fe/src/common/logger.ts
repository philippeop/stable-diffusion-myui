/* Author: Tase#6969 */
const DEBUG = true;
const PERFORMANCE = true;
const QUERY = false;
const perf_measure_starts: number[] = [];

// NodeJS
const TOKEN_RESET = '\x1b[0m'
const TOKEN_GREEN = '\x1b[32m'
const TOKEN_DIM = '\x1b[2m'
const TOKEN_YELLOW = '\x1b[33m'
const TOKEN_RED = '\x1b[31m'

const RED_STYLE = 'color:red;background-color:#000;font-weight:bolder;font-size:18px'
const GREEN_STYLE = 'color:#3b9;background-color:#000;font-weight:bolder;font-size:18px'
const YELLOW_STYLE = 'color:#f30;background-color:#420;font-weight:bolder;font-size:18px'
const DIM_STYLE = 'color:gray;font-weight:bolder;font-size:18px'

const IS_NODE = typeof window === 'undefined'

export class Logger {
    /** console.log green text */
    static log(...params: unknown[]): void {
        // tslint:disable-next-line: no-console
        console.log(...this.green('[LOG]', ...params));
    }

    /** console.log a dim message, use log for debugging, debug for monitoring */
    static debug(...params: unknown[]): void {
        if (DEBUG) {
            // tslint:disable-next-line: no-console
            console.log(...this.dim('[DEBUG]', ...params));
        }
    }

    /** console.error + throws message */
    static error(...params: unknown[]): void {
        this.softError(...params)
        throw new Error(params.join(' '));
    }

    /** Like error but doesnt re-throw message */
    static softError(...params: unknown[]): void {
        // tslint:disable-next-line: no-console
        console.error(...this.red('[ERROR]', ...params));
        let message = '';
        for (const p of params) {
            message += p + ' ';
        }
    }

    /** console.log yellow text */
    static warn(...params: unknown[]): void {
        console.warn(...this.yellow('[WARN]', ...params));
    }

    static pad(str: string, length = 4): string {
        const z = '0';
        str = str + '';
        return str.length >= length ? str : new Array(length - str.length + 1).join(z) + str;
    }

    static query(...params: unknown[]): void {
        if (QUERY) {
            // tslint:disable-next-line: no-console
            console.log('[QUERY]', ...params);
        }
    }

    static debugParams(paramsObj: unknown[]): void {
        const parts: string[] = [];
        for (const key in paramsObj) {
            const val = paramsObj[key];
            parts.push(key + ' = ' + val);
        }
        this.debug('Params:', parts.join(', '));
    }

    static measureStart(): void {
        perf_measure_starts.push((new Date()).getTime());
    }

    static measureReport(message: string): void {
        const perf_measure_start = perf_measure_starts[perf_measure_starts.length - 1];
        const perf_measure_now = (new Date()).getTime();
        console.log('[PERFM]', message, '[' + (perf_measure_now - perf_measure_start), 'ms]');
    }

    static measureStop(message?: string) {
        const perf_measure_start = perf_measure_starts.pop();
        if (perf_measure_start === undefined) {
            throw new Error('measureStop without measureStart, good luck');
        }
        const perf_measure_stop = (new Date()).getTime();
        if (PERFORMANCE && message) {
            // tslint:disable-next-line: no-console
            console.log('[PERFM]', message, '[' + (perf_measure_stop - perf_measure_start), 'ms]');
        }
    }

    static truncate(str: string): string {
        return (typeof str === 'string' && str.length > 100) ? (str.substring(0, 100) + '...') : str;
    }

    static green = (...params: unknown[]) => (IS_NODE ? this.node_green(...params) : this.brws_green(...params))
    static dim = (...params: unknown[]) => (IS_NODE ? this.node_dim(...params) : this.brws_dim(...params))
    static yellow = (...params: unknown[]) => (IS_NODE ? this.node_yellow(...params) : this.brws_yellow(...params))
    static red = (...params: unknown[]) => (IS_NODE ? this.node_red(...params) : this.brws_red(...params))

    static node_green = (...params: unknown[]) => [TOKEN_GREEN, ...params, TOKEN_RESET]
    static node_dim = (...params: unknown[]) => [TOKEN_DIM, ...params, TOKEN_RESET]
    static node_yellow = (...params: unknown[]) => [TOKEN_YELLOW, ...params, TOKEN_RESET]
    static node_red = (...params: unknown[]) => [TOKEN_RED, ...params, TOKEN_RESET]

    static brws_green = (...params: unknown[]) => ['%c' + params.join(" "), GREEN_STYLE]
    static brws_dim = (...params: unknown[]) => ['%c' + params.join(" "), DIM_STYLE]
    static brws_yellow = (...params: unknown[]) => ['%c' + params.join(" "), YELLOW_STYLE]
    static brws_red = (...params: unknown[]) => ['%c' + params.join(" "), RED_STYLE]
}
