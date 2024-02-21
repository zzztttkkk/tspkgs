import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const content = JSON.parse(readFileSync("./package.json"));

const parts = content.version.split(".").map((v) => Number.parseInt(v));

parts[2] = parts[2] + 1;

content.version = parts.join(".");

const latest_git_commit_hash = execSync("git rev-list --max-count=1 HEAD")
	.toString("utf-8")
	.trim();

content.latest_git_commit_hash = latest_git_commit_hash;

writeFileSync("./package.json", JSON.stringify(content, null, 4), {
	encoding: "utf-8",
});
