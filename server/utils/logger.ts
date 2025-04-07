export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

export function log(message: string, level: LogLevel = LogLevel.INFO): void {
    const timestamp = new Date().toISOString();
    // you cam extend this to write to a file if needed.
    console.log(`[${timestamp}] [${level}] ${message}`);
}

export function info(message: string): void {
    log(message, LogLevel.INFO);
}

export function warn(message: string): void {
    log(message, LogLevel.WARN);
}

export function error(message: string): void {
    log(message, LogLevel.ERROR);
}