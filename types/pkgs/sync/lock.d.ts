export declare class Lock {
    private locked;
    private readonly waiters;
    constructor();
    acquire(): Promise<void>;
    release(): void;
    within<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T>;
}
