interface ExecOptions {
    Timeout?: number;
    GetIdx?: (idx: bigint) => void;
}
export declare const Errors: {
    Timeouted: Error;
    Canceled: Error;
};
export declare class TypedWorker<Input, Output> {
    private worker;
    private waiters;
    private idx;
    constructor(file: string);
    private get nid();
    private makeTimeoutFunc;
    exec(msg: Input, opts?: ExecOptions): Promise<Output>;
    cancel(idx: bigint): void;
    get busycount(): number;
    get idle(): boolean;
}
export declare enum TypedWorkerPoolDispatchPolicy {
    Random = 0,
    Blance = 1
}
export declare class TypedWorkerPool<Input, Output> {
    private workers;
    constructor(size: number, file: string, policy?: TypedWorkerPoolDispatchPolicy);
    private blanceExec;
    exec(msg: Input, opts?: ExecOptions): Promise<Output>;
}
export interface Hooks {
    OnCanceled: (cb: () => void) => void;
    OnTimeouted: (cb: () => void) => void;
}
export declare function Work<Input, Output>(fn: (i: Input, hooks: Hooks) => Promise<Output> | Output): void;
export {};
