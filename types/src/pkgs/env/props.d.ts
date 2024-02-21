import "reflect-metadata";
export interface PropOptions {
    aliases?: string[];
    caseSensitive?: boolean;
    optional?: boolean;
    noTrimSpace?: boolean;
    description?: string;
}
export interface Info {
    opts: PropOptions;
    type: any;
}
export declare const AllReflectInfos: Map<any, Map<string, Info>>;
export declare function prop(opts?: PropOptions): PropertyDecorator;
