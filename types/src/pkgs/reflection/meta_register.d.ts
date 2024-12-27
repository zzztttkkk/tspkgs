/// <reference types="node" resolution-mode="require"/>
import "reflect-metadata";
import { inspect } from "node:util";
import type { IMergeOptions } from "./merge.js";
export declare class PropInfo<T> {
    readonly designtype: any;
    readonly accessorstatus?: {
        canget?: boolean;
        canset?: boolean;
    };
    readonly opts?: T;
    constructor(designtype: any, opts?: T);
}
declare class MethodInfo<T, A> {
    paramtypes: any[] | undefined;
    returntype: any | undefined;
    opts?: T;
    readonly paramopts: Map<number, A | undefined>;
    constructor();
}
type PropsMetaMap<T> = Map<string, PropInfo<T>>;
type MethodsMetaMap<T, A> = Map<string, MethodInfo<T, A>>;
declare class MetaInfo<ClsOpts, PropOpts, MethodOpts, ParamOpts> {
    #private;
    constructor(register: MetaRegister<ClsOpts, PropOpts, MethodOpts, ParamOpts>, cls: Function);
    cls(): ClsOpts | undefined;
    props(): PropsMetaMap<PropOpts> | undefined;
    methods(): MethodsMetaMap<MethodOpts, ParamOpts> | undefined;
    prop(name: string): PropInfo<PropOpts> | undefined;
}
export declare function metainfo<ClsOpts, PropOpts, MethodOpts, ParamOpts>(register: MetaRegister<ClsOpts, PropOpts, MethodOpts, ParamOpts>, cls: Function): MetaInfo<ClsOpts, PropOpts, MethodOpts, ParamOpts>;
export declare class MetaRegister<ClsOpts = unknown, PropOpts = unknown, MethodOpts = unknown, ParamOpts = unknown> {
    readonly name: symbol;
    private readonly _clsMetaData;
    private readonly _propsMetaData;
    private readonly _methodsMetaData;
    constructor(name: symbol);
    cls(opts?: ClsOpts): ClassDecorator;
    prop(opts?: PropOpts): PropertyDecorator;
    method(opts?: MethodOpts): MethodDecorator;
    param(opts?: ParamOpts): ParameterDecorator;
    bind<T>(cls: ClassOf<T>, src: any): T;
    merge<T>(dest: T, srcs: any[], opts?: IMergeOptions<PropOpts>): any;
}
export declare class ContainerType {
    readonly eletype: TypeValue;
    readonly bindhint?: any;
    constructor(v: TypeValue, bindhint?: any);
    [inspect.custom](): string;
}
export type TypeValue = ContainerType | Function;
export declare class ArrayType extends ContainerType {
}
export declare class SetType extends ContainerType {
}
export declare class MapType extends ContainerType {
    readonly keytype: TypeValue;
    readonly keybindhint?: any;
    constructor(k: TypeValue, v: TypeValue, bindhints?: {
        key?: any;
        value?: any;
    });
    [inspect.custom](): string;
}
export declare const containers: {
    array: (v: TypeValue, bindhint?: any) => ArrayType;
    set: (v: TypeValue, bindhint?: any) => SetType;
    map: (k: TypeValue, v: TypeValue, bindhints?: {
        key?: any;
        value?: any;
    }) => MapType;
};
export {};
