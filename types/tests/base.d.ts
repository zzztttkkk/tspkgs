import "../src/index.js";
export declare function equal(a: any, b: any): void;
export declare function require_true(a: any): void;
export declare function require_false(a: any): void;
export declare class Namespace {
    #private;
    constructor(name: string);
    func(f: Function): string;
}
