import "./pkgs/internal/globals/index.js";

import { SetDefaultBoolTransformHint } from "./pkgs/transform/index.js";

import * as sync from "./pkgs/sync/index.js";
import * as io from "./pkgs/io/index.js";
import * as env from "./pkgs/env/index.js";
import * as args from "./pkgs/args/index.js";
import * as reflection from "./pkgs/reflection/index.js";

import { Hole, sleep, ismain, UniqueId, __ } from "./pkgs/internal/index.js";
import { TypedWorker, Work } from "./pkgs/worker/worker.js";

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

export const Settings = {
	SetDefaultBoolTransformHint,
};
