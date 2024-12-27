declare global {
    interface PromiseConstructor {
        NewWithAbortSignal<T>(abortsignal: AbortSignal | undefined): {
            resolve: (val: T) => void;
            reject: (err: any) => void;
            promise: Promise<T>;
        };
    }
}
export {};
