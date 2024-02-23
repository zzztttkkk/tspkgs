import { SetDefaultBoolTransformHint } from "./pkgs/transform/index.js";

import * as sync from "./pkgs/sync/index.js";
import * as io from "./pkgs/io/index.js";
import * as env from "./pkgs/env/index.js";
import * as args from "./pkgs/args/index.js";
import * as reflection from "./pkgs/reflection/index.js";

import { Hole, sleep, ismain, UniqueId, __ } from "./pkgs/internal/index.js";
import { TypedWorker, Work } from "./pkgs/worker/worker.js";
import { inspect } from "util";

export {
	__,
	args,
	sync,
	io,
	Hole,
	sleep,
	env,
	ismain,
	UniqueId,
	TypedWorker,
	Work,
	reflection,
};

declare global {
	interface Console {
		json(v: any): void;
		inspect(v: any): void;
	}

	interface SymbolConstructor {
		transform: symbol;
	}

	interface ClassOf<T> {
		new (...args: any): T;
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

	function transform(
		src: any,
		cls: NumberConstructor,
		hint?: __pkgs.NumberTransformHint,
	): Number;
	function transform(
		src: any,
		cls: BooleanConstructor,
		hint?: __pkgs.BooleanTransformHint,
	): Boolean;
	function transform<T>(src: any, cls: ClassOf<T>, hint?: any): T;
}

(console as any).json = function (v: any) {
	console.log(JSON.stringify(v, null, 2));
};

(console as any).inspect = function (v: any) {
	console.log(inspect(v));
};

export const Settings = {
	SetDefaultBoolTransformHint,
};
