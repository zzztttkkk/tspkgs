import "reflect-metadata";
import { IsClass } from "./classes.js";
import { inspect } from "util";

export class PropInfo<T> {
	public readonly designtype: any;
	public readonly accessorstatus?: {
		canget?: boolean;
		canset?: boolean;
	};
	public readonly opts?: T = undefined;

	constructor(designtype: any, opts?: T) {
		this.designtype = designtype;
		this.opts = opts;
	}
}

class MethodInfo<T> {
	public readonly paramtypes: any[];
	public readonly returntype: any;
	public readonly opts?: T;

	constructor(paramtypes: any[], returntype: any, opts?: T) {
		this.paramtypes = paramtypes;
		this.returntype = returntype;
		this.opts = opts;
	}
}

type PropsMetaMap<T> = Map<string, PropInfo<T>>;
type MethodsMetaMap<T> = Map<string, MethodInfo<T>>;

class MetaInfo<ClsOpts, PropOpts, MethodOpts> {
	#cls: Function;
	#register: MetaRegister<ClsOpts, PropOpts, MethodOpts>;

	constructor(
		register: MetaRegister<ClsOpts, PropOpts, MethodOpts>,
		cls: Function,
	) {
		this.#register = register;
		this.#cls = cls;
	}

	cls(): ClsOpts | undefined {
		//@ts-ignore
		return this.#register._clsMetaData.get(this.#cls);
	}

	props(): PropsMetaMap<PropOpts> | undefined {
		//@ts-ignore
		return this.#register._propsMetaData.get(this.#cls);
	}

	prop(name: string): PropInfo<PropOpts> | undefined {
		return this.props()?.get(name);
	}
}

export function metainfo<ClsOpts, PropOpts, MethodOpts>(
	register: MetaRegister<ClsOpts, PropOpts, MethodOpts>,
	cls: Function,
): MetaInfo<ClsOpts, PropOpts, MethodOpts> {
	if (!IsClass(cls)) {
		throw new Error(`${inspect(cls)} is not a class`);
	}
	return new MetaInfo(register, cls);
}

export class MetaRegister<ClsOpts, PropOpts, MethodOpts> {
	public readonly name: symbol;

	private readonly _clsMetaData: Map<Function, ClsOpts>;
	private readonly _propsMetaData: Map<Function, PropsMetaMap<PropOpts>>;
	private readonly _methodsMetaData: Map<Function, MethodsMetaMap<MethodOpts>>;

	constructor(name: symbol) {
		this.name = name;
		this._clsMetaData = new Map();
		this._propsMetaData = new Map();
		this._methodsMetaData = new Map();
	}

	cls(opts?: ClsOpts): ClassDecorator {
		return (target) => {
			if (opts) {
				this._clsMetaData.set(target, opts);
			}
		};
	}

	prop(opts?: PropOpts): PropertyDecorator {
		return (target, key, desc?: TypedPropertyDescriptor<any>) => {
			if (typeof key === "symbol") {
				throw new Error(`decorator can not on a symbol`);
			}

			const cls: Function = target.constructor;

			let pm: PropsMetaMap<PropOpts>;
			pm = this._propsMetaData.get(cls) || new Map();

			let designType = Reflect.getMetadata("design:type", target, key);
			if (desc) {
				if (!desc.get) throw new Error(`prop decorator on a method`);
				designType = Reflect.getMetadata("design:returntype", target, key);
			}

			const info = new PropInfo(designType, opts);
			if (desc) {
				//@ts-ignore
				info.accessorstatus = {};
				info.accessorstatus.canget = desc.get != null;
				info.accessorstatus.canset = desc.set != null;
			}
			pm.set(key, info);
			this._propsMetaData.set(cls, pm);
		};
	}

	method(opts?: MethodOpts): MethodDecorator {
		return (target, key, desc) => {
			if (typeof key === "symbol") {
				throw new Error(`decorator can not on a symbol`);
			}
			if (desc.get || desc.set) {
				throw new Error(`method decorator on a accessor`);
			}

			const cls: Function = target.constructor;

			let pm: MethodsMetaMap<MethodOpts>;
			pm = this._methodsMetaData.get(cls) || new Map();
			pm.set(
				key,
				new MethodInfo(
					Reflect.getMetadata("design:paramtypes", target, key),
					Reflect.getMetadata("design:returntype", target, key),
					opts,
				),
			);
			this._methodsMetaData.set(cls, pm);
		};
	}

	param(): ParameterDecorator {
		return (...args) => {
			console.log(args);
		};
	}
}

export class ContainerType {
	public readonly eletype: TypeValue;
	public readonly bindhint?: any;

	constructor(v: TypeValue, bindhint?: any) {
		this.eletype = v;
		this.bindhint = bindhint;
	}

	[inspect.custom]() {
		return `[${Object.getPrototypeOf(this).constructor.name} of ${inspect(
			this.eletype,
		)}]`;
	}
}

export type TypeValue = ContainerType | Function;

export class ArrayType extends ContainerType {}

export class SetType extends ContainerType {}

export class MapType extends ContainerType {
	public readonly keytype: TypeValue;
	public readonly keybindhint?: any;

	constructor(
		k: TypeValue,
		v: TypeValue,
		bindhints?: { key?: any; value?: any },
	) {
		super(v, bindhints?.value);
		this.keytype = k;
		this.keybindhint = bindhints?.key;
	}

	[inspect.custom]() {
		return `[${Object.getPrototypeOf(this).constructor.name} of { k: ${inspect(
			this.keytype,
		)}, v: ${inspect(this.eletype)}]}`;
	}
}

export const containers = {
	array: (v: TypeValue, bindhint?: any) => new ArrayType(v, bindhint),
	set: (v: TypeValue, bindhint?: any) => new SetType(v, bindhint),
	map: (k: TypeValue, v: TypeValue, bindhints?: { key?: any; value?: any }) =>
		new MapType(k, v, bindhints),
};
