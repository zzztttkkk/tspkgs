export declare function choice<T>(array: T[]): T;
export interface RandStringOptions {
    crypto?: boolean;
}
export declare function string(size: number, opts?: RandStringOptions): Promise<string>;
