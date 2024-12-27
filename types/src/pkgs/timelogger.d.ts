type TimeKind = "system" | "process";
export declare class TimeLogger {
    #private;
    constructor(name: string, kind?: TimeKind);
    log(...args: any[]): void;
}
export {};
