import { MetaRegister, PropInfo, TypeValue } from "./meta_register.js";
type SrcPeekFunc<P> = (src: any, key: string, info: PropInfo<P>) => any;
export interface IBindPropOpts {
    type?: TypeValue;
    bindhint?: any;
}
export declare function bind<T, P extends IBindPropOpts>(register: MetaRegister<unknown, P, unknown>, cls: ClassOf<T>, src: any, opts?: {
    proppeek?: SrcPeekFunc<P>;
    constructorargs?: any[];
}): T;
export {};
