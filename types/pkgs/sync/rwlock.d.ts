export declare class RwLock {
    private readonly lock;
    private writing;
    private readings;
    private readonly waiters;
    constructor();
    releasew(): Promise<void>;
    releaser(): Promise<void>;
    acquirew(): Promise<void>;
    acquirer(): Promise<void>;
    private within;
    withinw<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T>;
    withinr<T, Args>(fn: (args?: Args) => Promise<T> | T, args?: Args): Promise<T>;
}
