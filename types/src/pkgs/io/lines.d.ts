/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
export declare function lines(rs: NodeJS.ReadableStream, opts?: {
    encoding?: BufferEncoding;
    maxlength?: number;
}): AsyncGenerator<string, void, undefined>;
