import {AllReflectInfos, PropOptions} from "./props.js";
import * as process from "process";
import {parse} from "./parse.js";
import {prop} from "./props.js";
import {FilePath, DirPath, Duration} from "./types.js";

export {prop, FilePath, Duration, DirPath};

const InstanceCache = new Map<any, any>();

function get(obj: NodeJS.Dict<string>, k: string, opts: PropOptions): string | undefined {
    let keys = [k, opts.name] as (string | undefined)[];
    if (opts.aliases) {
        keys = keys.concat(opts.aliases);
    }

    if (opts.caseSensitive) {
        for (const key of keys) {
            if (!key) continue;
            const v = obj[key];
            if (typeof v === "string") {
                return v;
            }
        }
        return undefined;
    }

    keys = keys.filter((v) => Boolean(v)).map((v) => v!.toUpperCase());

    const tmp = {} as any;
    Object.keys(obj).forEach((k) => {
        tmp[k.toUpperCase()] = obj[k];
    });

    for (const key of keys) {
        const v = tmp[key!];
        if (typeof v === "string") {
            return v;
        }
    }
    return undefined;
}

export async function Env<T>(
    cls: { new(): T },
    opts?: { dest?: NodeJS.Dict<string>, fp?: string }
): Promise<T> {
    let ins = InstanceCache.get(cls);
    if (ins) return ins;

    const reflectInfos = AllReflectInfos.get(cls);
    if (!reflectInfos || reflectInfos.size < 1) {
        throw new Error(`empty reflect infos for [class ${cls.name}]`);
    }

    opts = opts || {};
    const userDest = opts.dest || process.env;
    const dest: NodeJS.Dict<string> = {};
    opts.dest = dest;
    await parse(opts.fp, opts.dest);

    ins = new cls();

    for (const [k, info] of reflectInfos) {
        const opts = info.opts;
        let rawval = get(dest, k, opts);
        if (typeof rawval === "undefined") {
            if (opts.optional) {
                continue;
            }
            throw new Error(`missing required env value, [${cls.name}.${k}]`);
        }

        if (!opts.noTrimSpace) {
            rawval = rawval.trim();
        }

        let fv: any;

        switch (info.type) {
            case Number: {
                const num = Number.parseInt(rawval);
                if (Number.isNaN(num)) {
                    throw new Error(
                        `number value is NaN, [${cls.name}.${k} = ${rawval}]`
                    );
                }

                if (opts.min && num < opts.min) {
                    throw new Error(
                        `number value out of range, [${cls.name}.${k} = ${num}]`
                    );
                }
                if (opts.max && num > opts.max) {
                    throw new Error(
                        `number value out of range, [${cls.name}.${k} = ${num}]`
                    );
                }

                if (!opts.allowEmpty && num === 0) {
                    throw new Error(`zero number value, [${cls.name}.${k}]`);
                }

                fv = num;
                break;
            }
            case String: {
                if (opts.regexp && !rawval.match(opts.regexp)) {
                    throw new Error(
                        `string value not match, [${cls.name}.${k} = ${rawval}]`
                    );
                }
                if (opts.enum && !opts.enum.includes(rawval)) {
                    throw new Error(
                        `string value not in enum{${opts.enum}}, [${cls.name}.${k} = ${rawval}]`
                    );
                }

                fv = rawval;
                if (!opts.allowEmpty && rawval.length < 1) {
                    throw new Error(`empty string value, [${cls.name}.${k}]`);
                }
                break;
            }
            case Boolean: {
                fv = ["true", "t", "ok"].includes(rawval.toLocaleLowerCase());
                break;
            }
            default: {
                fv = new info.type(rawval, opts);
            }
        }

        if (opts.checker && !opts.checker(fv)) {
            throw new Error(`custom validate failed, [${cls.name}.${k} = ${fv}]`);
        }

        (ins as any)[k] = fv;

        if (!opts.notChangeProcessEnv) {
            const envName = opts.processEnvName
                ? opts.processEnvName
                : opts.name
                    ? opts.name.toUpperCase()
                    : k.toUpperCase();

            userDest[envName] = fv.toString();
        }
    }
    InstanceCache.set(cls.prototype, ins);
    return ins;
}
