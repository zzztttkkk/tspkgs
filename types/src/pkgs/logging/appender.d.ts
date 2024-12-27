export interface Appender {
    append(at: number, log: string): Promise<void>;
    close(): Promise<void>;
}
export declare class ConsoleAppender implements Appender {
    append(at: number, log: string): Promise<void>;
    close(): Promise<void>;
}
export type AppendFuncType = (at: number, log: string) => Promise<void>;
export type CloseFuncType = () => Promise<void>;
export declare class FuncAppender implements Appender {
    private append_fn;
    private close_fn;
    constructor(append_fn: AppendFuncType | null, close_fn?: CloseFuncType | null);
    append(at: number, log: string): Promise<void>;
    close(): Promise<void>;
}
