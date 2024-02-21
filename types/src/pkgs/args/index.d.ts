interface IBaseOpts {
    alias?: string[];
    type?: any;
    desc?: string;
}
interface IFlagOpts extends IBaseOpts {
}
interface ICmdOpts extends IBaseOpts {
}
interface IAppOpts {
    name?: string;
    desc?: string;
}
export declare function app(opts?: IAppOpts): ClassDecorator;
export declare function flag(opts?: IFlagOpts): PropertyDecorator;
export declare function subcmd(opts?: ICmdOpts): PropertyDecorator;
declare const NODE_PATH: string, SCRIPT_PATH: string;
export { NODE_PATH, SCRIPT_PATH };
export declare abstract class AbsCmd<Parent, Top> {
    private readonly NeedHelp;
    abstract run(parent?: Parent, top?: Top): Promise<void>;
}
export declare function Parse<T extends AbsCmd<unknown, unknown>>(cls: new () => T): T;
export declare function Run<T extends AbsCmd<unknown, unknown>>(cls: new () => T): Promise<void>;
