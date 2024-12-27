/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
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
    noendl?: boolean;
    endl?: Buffer;
}
export declare const ReadTimeoutError: Error;
export declare const ReachMaxSizeError: Error;
export declare const Errors: {
    Eof: Error;
    Closed: Error;
};
export declare class Reader {
    private src;
    private bufs;
    private cursor;
    private error?;
    private reject?;
    private buf_resolve?;
    private buf_reject?;
    constructor(src: NodeJS.ReadableStream);
    private init;
    private onerr;
    ensurebufs(): Promise<Buffer | null>;
    settimeout(ms: number | undefined): NodeJS.Timeout | undefined;
    readonce(opts?: BaseReadOptions): Promise<Buffer>;
    readexactly(n: number, opts?: ReadOptions): Promise<Buffer>;
    readuntil(required: string | Buffer, opts?: ReadUntilOptions): Promise<Buffer>;
    readline(opts?: ReadLineOptions): Promise<Buffer>;
}
export {};
