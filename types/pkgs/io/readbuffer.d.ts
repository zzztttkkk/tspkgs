/// <reference types="node" resolution-mode="require"/>
interface BaseReadOptions {
    timeout?: number;
}
export interface ReadOptions extends BaseReadOptions {
    tmp?: Buffer;
}
export interface ReadUntilOptions extends BaseReadOptions {
    allocsize?: number;
    maxsize?: number;
}
export interface ReadLineOptions extends ReadUntilOptions {
    removeEndl?: boolean;
    endl?: Buffer;
}
export declare const ReadTimeoutError: Error;
export declare const ReachMaxSizeError: Error;
export interface BinaryReadStream {
    on(event: "close", listener: () => void): this;
    on(event: "data", listener: (chunk: Buffer) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
}
export declare class Reader {
    private bufs;
    private cursor;
    private error?;
    private reject?;
    private buf_resolve?;
    private buf_reject?;
    private constructor();
    private onerr;
    static from(src: BinaryReadStream): Reader;
    read(n: number, opts?: ReadOptions): Promise<Buffer>;
    readuntil(required: number, opts?: ReadUntilOptions): Promise<Buffer>;
    readline(opts?: ReadLineOptions): Promise<Buffer>;
}
export {};
