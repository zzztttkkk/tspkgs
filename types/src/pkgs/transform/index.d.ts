export declare function SetDefaultBoolTransformHint(opts: __pkgs.BooleanTransformHint): void;
declare global {
    interface SymbolConstructor {
        transform: symbol;
    }
    namespace __pkgs {
        interface BooleanTransformHint {
            truths?: string[];
            casesensitive?: boolean;
            directly?: boolean;
        }
        interface NumberTransformHint {
            radix?: number;
        }
    }
    function transform(src: any, cls: NumberConstructor, hint?: __pkgs.NumberTransformHint): number;
    function transform(src: any, cls: BooleanConstructor, hint?: __pkgs.BooleanTransformHint): boolean;
    function transform<T>(src: any, cls: ClassOf<T>, hint?: any): T;
}
