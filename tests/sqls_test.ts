import { projectroot } from "../src/pkgs/internal/index.js";
import { Sqls } from "../src/pkgs/sqls.js";

import * as fs from "fs/promises";

const root = await projectroot(import.meta);

const txt = await fs.readFile(`${root}/tests/sqls.test.sql`, "utf8");

const begin = process.hrtime.bigint();
const stmts = Sqls.scan(txt);

console.log(`cost: ${process.hrtime.bigint() - begin}ns`);
// console.log(JSON.stringify(stmts, null, 2));
