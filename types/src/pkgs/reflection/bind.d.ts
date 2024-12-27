import { type MetaRegister, type TypeValue } from "./meta_register.js";
export declare function __bind(typev: TypeValue, obj: any, hint?: any): any;
export interface IBindPropOpts {
    type?: TypeValue;
    bindhint?: any;
}
export declare function bind<T, P extends IBindPropOpts>(register: MetaRegister<unknown, P, unknown>, cls: ClassOf<T>, src: any): T;
