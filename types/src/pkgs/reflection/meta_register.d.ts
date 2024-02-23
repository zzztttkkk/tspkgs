/// <reference types="node" resolution-mode="require"/>
import "reflect-metadata";
import { inspect } from "util";
export declare class PropInfo<T> {
    readonly designtype: any;
    readonly accessorstatus?: {
        canget?: boolean;
        canset?: boolean;
    };
    readonly opts?: T;
    constructor(designtype: any, opts?: T);
}
type PropsMetaMap<T> = Map<string, PropInfo<T>>;
declare class MetaInfo<ClsOpts, PropOpts, MethodOpts> {
    #private;
    constructor(register: MetaRegister<ClsOpts, PropOpts, MethodOpts>, cls: Function);
    cls(): ClsOpts | undefined;
    props(): PropsMetaMap<PropOpts> | undefined;
    prop(name: string): PropInfo<PropOpts> | undefined;
}
export declare function metainfo<ClsOpts, PropOpts, MethodOpts>(register: MetaRegister<ClsOpts, PropOpts, MethodOpts>, cls: Function): MetaInfo<ClsOpts, PropOpts, MethodOpts>;
export declare class MetaRegister<ClsOpts, PropOpts, MethodOpts> {
    readonly name: symbol;
    private readonly _clsMetaData;
    private readonly _propsMetaData;
    private readonly _methodsMetaData;
    constructor(name: symbol);
    cls(opts?: ClsOpts): ClassDecorator;
    prop(opts?: PropOpts): PropertyDecorator;
    method(opts?: MethodOpts): MethodDecorator;
    param(): ParameterDecorator;
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
