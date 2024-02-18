import { content } from "./content.js";
import { Reader } from "./readbuffer.js";
import { lines } from "./lines.js";
export { content, Reader, lines };
export declare function importall(patterns: string[]): Promise<any[]>;
export declare function exists(fp: string): Promise<boolean>;
