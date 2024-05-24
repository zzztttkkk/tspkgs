import { classof } from "../reflection/classes.js";
import {
	MetaRegister,
	PropInfo,
	metainfo,
} from "../reflection/meta_register.js";
import { IntOutOfRangeError, MissingRequiredError } from "./errors.js";

interface BaseOpts {
	optional?: boolean;
}

interface IntOpts extends BaseOpts {
	max?: number;
	min?: number;
}

export interface PropOptions extends IntOpts {}

const register = new MetaRegister<never, PropOptions, never>(
	Symbol("tspkgs.vld"),
);

export function prop(opts?: PropOptions): PropertyDecorator {
	return register.prop(opts);
}

export function int(opts?: IntOpts): PropertyDecorator {
	return register.prop(opts);
}

export function validate<T>(obj: T): Error | null {
	const cls = classof(obj);
	const props = metainfo(register, cls).props();
	if (!props) {
		return null;
	}
	for (const [k, opts] of props) {
		const e = validate_one(cls, k, Reflect.get(obj as any, k), opts);
		if (e != null) return e;
	}
	return null;
}

function validate_one(
	cls: Function,
	k: string,
	val: any,
	opts: PropInfo<PropOptions>,
): Error | null {
	if (val == null) {
		if (opts.opts?.optional) {
			return null;
		}
		return new MissingRequiredError(cls, k, val);
	}

	switch (opts.designtype) {
		case Number: {
			if (opts.opts?.min != null && val < opts.opts.min) {
				return new IntOutOfRangeError(
					cls,
					k,
					val,
					opts.opts.min,
					opts.opts.max,
				);
			}
			if (opts.opts?.max != null && val > opts.opts.max) {
				return new IntOutOfRangeError(
					cls,
					k,
					val,
					opts.opts.min,
					opts.opts.max,
				);
			}
			break;
		}
		case String: {
			break;
		}
		case Boolean: {
			break;
		}
		default: {
		}
	}

	return null;
}
