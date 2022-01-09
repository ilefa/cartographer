import { getEnumKeyByEnumValue, isDevelopment } from '.';

export enum LogLevel {
    INFO = 'Info',
    WARN = 'Warning',
    ERROR = 'Error',
}

export enum LogLevelColor {
    INFO = '#66a7c5',
    WARN = '#ffa726',
    ERROR = '#d32f2f',
    TIMINGS = '#6dc466',
}

/**
 * Logs a message with the specified log level,
 * module name, text, and other parameters if provided.
 * 
 * @param level the log level for this message
 * @param module the module to log this message under
 * @param text the text to log
 * @param opts any optional parameters to pass to the logger
 */
export const log = (level: LogLevel, module: string | null, text: string, ...opts: string[]) => {
    let header = module ?? level;
    let color = LogLevelColor[getEnumKeyByEnumValue(LogLevel, level) as string];
    console.log(`%c ${header.toUpperCase()} %c ${text}`, `background: ${color}; color: #fff;`, 'color: inherit;', opts);
}

/**
 * Logs a timings message to the console with
 * the provided log level, module name, and text.
 * 
 * @param module the module to time
 * @param task the task to log
 * @param start the start time of the task
 * @param color [optional] the color to use for the log level
 * @param what [optional] the action to log ("x [what] [time]")
 * @param cond [optional] under what condition to log the message
 * @param end [optional] the end time of the task
 */
export const timings = (module: string, task: string, start: number, color?: LogLevelColor, what = 'took', cond?: boolean, end: number = Date.now()) => {
    if (!isDevelopment())
        return;

    // this might look like gibberish, but it checks if the cond is set, and then if its false
    if (cond && !cond)
        return;

    let diff = (end - start).toFixed(2);
    console.log(`%c DEV %c [${module}] ${task} ${what} ${diff}ms.`, `background: ${color || LogLevelColor.TIMINGS}; color: #fff;`, 'color: inherit;');
}

/**
 * Logs a debug message to the console with
 * the provided log level, module name, and text.
 * 
 * @param module the module to debug
 * @param text the text to log
 * @param color [optional] the color to use for the log level
 * @param cond [optional] under what condition to log the message
 * @param data [optional] any additional params to pass to the logger
 */
export const debug = (module: string, text: string, color?: LogLevelColor, cond?: boolean, data?: any | any[]) => {
    if (!isDevelopment())
        return;

    // this might look like gibberish, but it checks if the cond is set, and then if its false
    if (cond && !cond)
        return; 

    if (data)
        return console.log(`%c DEV %c [${module}] ${text}`, `background: ${color || LogLevelColor.TIMINGS}; color: #fff;`, 'color: inherit;', data);

    console.log(`%c DEV %c [${module}] ${text}`, `background: ${color || LogLevelColor.TIMINGS}; color: #fff;`, 'color: inherit;');
}

/**
 * Logs a raw message to the console.
 * 
 * @param message the message to log
 * @param opts the optional parameters to pass to the logger
 */
export const raw = (message: string, ...opts: string[]) => console.log(message, opts);

/**
 * Clears the console.
 */
export const clear = () => console.clear();