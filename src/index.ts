import * as env from "./pkgs/env/index.js";
import * as sync from "./pkgs/sync/index.js";
import * as console from "console";
import {ismain, sleep} from "./pkgs/internal/index.js";

export {env, sync, sleep, ismain};

const lock = new sync.RwLock;

async function test_lock(idx: number) {
    await lock.withinr(async () => {
        await sleep(10);
        console.log(idx, Date.now());
    });
}

const ps = [] as Promise<void>[];

for (let i = 0; i < 100; i++) {
    ps.push(test_lock(i));
}

await Promise.all(ps);

console.log(ismain(import.meta));
