export declare namespace tspkgs {
    const delegates: {
        ReflectionRegisterBind: ((...args: any[]) => any) & {
            fill: (fn: (...args: any[]) => any) => void;
        };
        ReflectionRegisterMerge: ((...args: any[]) => any) & {
            fill: (fn: (...args: any[]) => any) => void;
        };
    };
}
export declare function Delegate<T extends Function>(meta: ImportMeta, name: string): T;
