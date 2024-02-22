import "../transform/index.js";
export interface PropOptions {
    aliases?: string[];
    optional?: boolean;
    keepspace?: boolean;
    description?: string;
    type?: Function;
}
export declare function prop(opts?: PropOptions): PropertyDecorator;
export declare function Get<T>(cls: new () => T): Promise<T>;
export declare function GenerateExampleIni<T>(cls: new () => T, fp: string): Promise<void>;
