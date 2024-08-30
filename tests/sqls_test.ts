import { projectroot } from "../src/pkgs/internal/index.js";
import { Sqls } from "../src/pkgs/sqls.js";

import * as fs from "fs/promises";

const root = await projectroot(import.meta);

const txt = await fs.readFile(`${root}/tests/sqls.test.sql`, "utf8");

console.log(JSON.stringify(Sqls.scan(txt), null, 2));
