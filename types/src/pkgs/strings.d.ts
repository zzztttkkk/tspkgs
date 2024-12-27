interface PaddingOpts {
    txt: string;
    count?: number;
}
export declare class Strings {
    static padding(v: string, left?: PaddingOpts, right?: PaddingOpts | {
        $SameAsLeft: boolean;
    }): string;
    static split(v: string, ...seps: string[]): string[];
}
export {};
