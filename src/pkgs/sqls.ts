type ValidateFunction = (v: any) => string | null;

interface Param {
	name: string;
	type?: string;
	desc?: string;
	validator?: ValidateFunction;
}

const ParamDefinitionRegexp = /@param\s+(?<paramname>\w+)\s+(?<funcs>.*)/g;
const FunctionRegexp = /((?<name>\w)\s*\(.*?\))+/g;

interface Stmt {
	comments: string[];
	sql: string[];
	params: Param[];
}

enum InCommentsState {
	Single = 1,
	Multiple = 2,
}

enum InParamState {
	InName = 1,
	Named = 2,
	InType = 3,
	Typed = 4,
}

function isasciiletter(c: string): boolean {
	return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

function isinlinespace(c: string): boolean {
	return c === " " || c === "\t" || c === "\r";
}

export class Sqls {
	private static params(stmts: Stmt[]): Stmt[] {
		for (const stmt of stmts) {
			if (stmt.params.length < 1) continue;

			for (let line of stmt.comments.flatMap((v) => v.split("\n"))) {
				line = line.trim();
				console.log(">>>", line);
				const match = ParamDefinitionRegexp.exec(line);
				if (!match) continue;
				const param = stmt.params.find(
					(ele) => ele.name === match.groups?.paramname,
				);
				if (!param) {
					console.log(match.groups?.paramname);
					continue;
				}
				console.log(param.name, match.groups?.funcs);
			}
		}
		return stmts;
	}

	static scan(doc: string): Stmt[] {
		const stmts: Stmt[] = [];

		let escaped = false;
		let incomments: InCommentsState | null = null;
		let qouted = "";
		let inparams: InParamState | null = null;

		let stmt: Stmt = {
			comments: [],
			sql: [],
			params: [],
		};
		let sqltmp = [] as string[];
		let commentstmp = [] as string[];
		let paramstmp = [] as string[];
		let ignoreone = false;

		for (let i = 0; i < doc.length; i++) {
			const cc = doc[i];
			const nc = i + 1 < doc.length ? doc[i + 1] : null;

			if (ignoreone) {
				ignoreone = false;
				continue;
			}

			if (escaped) {
				sqltmp.push(cc);
				escaped = false;
				continue;
			}

			if (incomments) {
				if (incomments === InCommentsState.Single) {
					if (cc == "\n") {
						stmt.comments.push(commentstmp.join(""));
						commentstmp.length = 0;
						incomments = null;
						continue;
					}
				} else {
					if (cc === "*" && nc === "/") {
						stmt.comments.push(commentstmp.join(""));
						commentstmp.length = 0;
						incomments = null;
						ignoreone = true;
						continue;
					}
				}
				commentstmp.push(cc);
				continue;
			}

			if (qouted) {
				sqltmp.push(cc);
				if (cc === qouted) {
					if (nc === qouted) {
						escaped = true;
						continue;
					}
					qouted = "";
				}
				continue;
			}

			if (cc === "-" && nc === "-") {
				incomments = InCommentsState.Single;
				commentstmp.length = 0;
				ignoreone = true;
				continue;
			}

			if (cc === "/" && nc === "*") {
				incomments = InCommentsState.Multiple;
				commentstmp.length = 0;
				ignoreone = true;
				continue;
			}

			if (cc === "$" && nc === "{") {
				inparams = InParamState.InName;
				stmt.sql.push(sqltmp.join(""));
				sqltmp.length = 0;
				ignoreone = true;
				continue;
			}

			if (inparams) {
				const getparamtmp = (kind: "name" | "type"): string => {
					const val = paramstmp.join("");
					paramstmp.length = 0;
					if (val === "") {
						throw new Error(`parameter ${kind} is empty`);
					}
					return val;
				};

				switch (inparams) {
					case InParamState.InName: {
						if (isinlinespace(cc)) {
							if (paramstmp.length < 1) {
								continue;
							} else {
								const name = getparamtmp("name");
								inparams = InParamState.Named;
								stmt.params.push({ name: name });
								break;
							}
						}
						if (cc === ":") {
							const name = getparamtmp("name");
							inparams = InParamState.InType;
							stmt.params.push({ name: name });
							break;
						}
						if (!isasciiletter(cc)) {
							throw new Error(
								"unexpected character, expecting `:` for parameter type being or any other character for parameter name",
							);
						}
						paramstmp.push(cc);
						break;
					}
					case InParamState.Named: {
						if (isinlinespace(cc)) {
							continue;
						}
						if (cc === ":") {
							inparams = InParamState.InType;
							break;
						}
						throw new Error(
							"unexpected character, expecting `:` for parameter type being",
						);
					}
					case InParamState.InType: {
						if (isinlinespace(cc)) {
							if (paramstmp.length < 1) {
								continue;
							} else {
								const type = getparamtmp("type");
								stmt.params[stmt.params.length - 1].type = type;
								inparams = InParamState.Typed;
								continue;
							}
						}
						if (cc === "}") {
							const type = getparamtmp("type");
							stmt.params[stmt.params.length - 1].type = type;
							inparams = null;
							break;
						}
						if (!isasciiletter(cc)) {
							throw new Error("unexpected character");
						}
						paramstmp.push(cc);
						break;
					}
					case InParamState.Typed: {
						if (isinlinespace(cc)) {
							continue;
						}
						if (cc === "}") {
							inparams = null;
							break;
						}
						throw new Error("unexpected character");
					}
					default: {
						throw new Error("unreachable code");
					}
				}
				continue;
			}

			switch (cc) {
				case "'":
				case '"': {
					qouted = cc;
					sqltmp.push(cc);
					break;
				}
				case ";": {
					stmt.sql.push(sqltmp.join(""));
					sqltmp.length = 0;
					inparams = null;
					stmts.push(stmt);
					stmt = {
						comments: [],
						sql: [],
						params: [],
					};
					break;
				}
				default: {
					sqltmp.push(cc);
					break;
				}
			}
		}

		if (escaped || incomments || qouted || inparams) {
			throw new Error("unexpected end of input");
		}

		if (sqltmp.length > 0) {
			stmt.sql.push(sqltmp.join(""));
		}
		if (commentstmp.length > 0) {
			stmt.comments.push(commentstmp.join(""));
		}
		if (stmt.sql.length > 0) {
			stmts.push(stmt);
		}

		stmts.forEach((ele) => {
			ele.comments = ele.comments
				.map((txt) => txt.trim())
				.filter((txt) => txt !== "");
			ele.sql = ele.sql.map((txt) => txt.trim());

			if (ele.params.length < 1) {
				ele.sql = ele.sql.filter((txt) => txt !== "");
			}
		});
		return this.params(stmts.filter((ele) => ele.sql.length > 0));
	}
}
