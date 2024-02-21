import { prop } from "./props.js";
export { prop };
export declare function Get<T>(cls: new () => T): Promise<T>;
export declare function GenerateExampleIni<T>(cls: new () => T, fp: string): Promise<void>;
