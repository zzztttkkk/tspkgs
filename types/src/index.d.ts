import * as sync from "./pkgs/sync/index.js";
import * as io from "./pkgs/io/index.js";
import * as env from "./pkgs/env/index.js";
import * as luxon from "luxon";
import * as args from "./pkgs/args/index.js";
import { Hole, sleep, ismain, UniqueId, __ } from "./pkgs/internal/index.js";
import { TypedWorker, Work } from "./pkgs/worker/worker.js";
export { __, args, sync, io, Hole, sleep, env, luxon, ismain, UniqueId, TypedWorker, Work, };
declare global {
    interface Console {
        json(v: any): void;
    }
}
