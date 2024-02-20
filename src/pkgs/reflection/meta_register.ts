import "reflect-metadata";
import { IsClass } from "./is_class.js";
import { inspect } from "util";

class PropInfo<T> {
	public readonly designtype: any;
	public readonly opts?: T;

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

	props(): PropsMetaMap<PropOpts> {
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

			pm.set(key, new PropInfo(designType, opts));
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
