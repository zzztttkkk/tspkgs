import "reflect-metadata";
export declare class PropInfo<T> {
    readonly designtype: any;
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
export {};
