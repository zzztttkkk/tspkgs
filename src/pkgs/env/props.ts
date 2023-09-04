import "reflect-metadata";
import {DirPath, Duration, FilePath} from "./types.js";

export interface PropOptions {
    name?: string;
    aliases?: string[];
    caseSensitive?: boolean;
    allowEmpty?: boolean;
    noTrimSpace?: boolean;

    // optional in env file
    optional?: boolean;

    // number validation
    min?: number;
    max?: number;

    // string validation
    regexp?: RegExp;
    enum?: string[];

    // fs
    fsAllowNotExists?: boolean;

    // custom validation
    checker?: (v: any) => boolean;

    // if true, do not change the process.env
    notChangeProcessEnv?: boolean;
    processEnvName?: string;
}

interface Info {
    opts: PropOptions;
    type: any;
}

export const AllReflectInfos = new Map<any, Map<string, Info>>();

export function prop(opts?: PropOptions): PropertyDecorator {
    return function (target: any, key: string | symbol) {
        if (typeof key === "symbol") return;
        const cls = (target as any).constructor;
        const clsName = cls.name as string;

        const designType = Reflect.getMetadata("design:type", target, key);
        if (!designType) {
            throw new Error(`undefined design:type: ${clsName}.${key}`);
        }

        if (
            ![Number, Boolean, String, DirPath, FilePath, Duration].includes(
                designType
            )
        ) {
            throw new Error(`type error: ${clsName}.${key}`);
        }

        let infos = AllReflectInfos.get(cls);
        if (!infos) {
            infos = new Map();
            AllReflectInfos.set(cls, infos);
        }
        infos.set(key, {opts: opts || {}, type: designType});
    };
}
