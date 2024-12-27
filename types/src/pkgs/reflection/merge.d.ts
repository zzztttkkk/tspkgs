import { type MetaRegister, type PropInfo, type TypeValue } from "./meta_register.js";
export interface IMergePropOpts {
    type?: TypeValue;
}
type CanOverWriteFn<P> = (dest: any, src: any, cls: Function, key: string, prop: PropInfo<P>) => boolean;
export interface IMergeOptions<P> {
    overwrite?: boolean | CanOverWriteFn<P>;
}
export declare function merge<T, P extends IMergePropOpts>(register: MetaRegister<unknown, P, unknown>, dest: T, src: any[], opts?: IMergeOptions<P>): T;
export {};
