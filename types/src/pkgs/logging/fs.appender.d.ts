import type { Appender } from "./appender.js";
export type RotationKind = "daily" | "hourly" | "minutely";
export declare class AsyncFileAppender implements Appender {
    private fp;
    private dir;
    private filename;
    private ext;
    private bufsize;
    private rotation;
    private rotationbeginat;
    private rotationendat;
    private fd;
    private buf;
    private currentbufsize;
    private closed;
    constructor(fp: string, opts?: {
        rotation?: RotationKind;
        bufsize?: number;
    });
    private static endat;
    private rotate;
    private flush;
    append(at: number, log: string): Promise<void>;
    close(): Promise<void>;
}
