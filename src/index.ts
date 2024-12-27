import "./pkgs/internal/globals/index.js";

import { SetDefaultBoolTransformHint } from "./pkgs/transform/index.js";

import * as sync from "./pkgs/sync/index.js";
import * as io from "./pkgs/io/index.js";
import * as env from "./pkgs/env/index.js";
import * as reflection from "./pkgs/reflection/index.js";

import { Delegate, sleep, ismain, UniqueId, __ } from "./pkgs/internal/index.js";
import * as threadinds from "./pkgs/worker/worker.js";
import { TimeLogger } from "./pkgs/timelogger.js";
import { enumerate, asyncenumerate } from "./pkgs/internal/enumerate.js";

export {
	__,
	sync,
	io,
	Delegate,
	sleep,
	env,
	ismain,
	UniqueId,
	threadinds,
	reflection,
	TimeLogger,
	enumerate,
	asyncenumerate,
};

export const Settings = {
	SetDefaultBoolTransformHint,
};
