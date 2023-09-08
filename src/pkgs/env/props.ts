import "reflect-metadata";

export interface PropOptions {
	aliases?: string[];
	caseSensitive?: boolean;
	optional?: boolean;
	noTrimSpace?: boolean;
}

interface Info {
	opts: PropOptions;
	type: any;
}

export const AllReflectInfos = new Map<any, Map<string, Info>>();

export function prop(opts?: PropOptions): PropertyDecorator {
	return function (target: any, key: string | symbol) {
		if (typeof key === "symbol") return;
		const cls = target.constructor;
		const clsName = cls.name as string;

		const designType = Reflect.getMetadata("design:type", target, key);
		if (![Number, Boolean, String].includes(designType)) {
			throw new Error(`type error: ${clsName}.${key}`);
		}

		let infos = AllReflectInfos.get(cls);
		if (!infos) {
			infos = new Map();
			AllReflectInfos.set(cls, infos);
		}
		infos.set(key, { opts: opts || {}, type: designType });
	};
}
