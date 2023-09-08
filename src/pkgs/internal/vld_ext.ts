import * as clsvld from "class-validator";
import * as fs from "fs";

export function Match(
	regexp: RegExp,
	opts?: clsvld.ValidationOptions,
): PropertyDecorator {
	return clsvld.ValidateBy(
		{
			name: "Match",
			constraints: [regexp],
			validator: {
				validate: (v, args): boolean => {
					if (typeof v !== "string") return false;
					return !!v.match(args!.constraints[0]);
				},
			},
		},
		opts,
	);
}

export function ExistsFilePath(opts?: clsvld.ValidationOptions) {
	return clsvld.ValidateBy(
		{
			name: "ExistsFilePath",
			constraints: [],
			validator: {
				validate: (v, _args): Promise<boolean> => {
					if (typeof v !== "string") return Promise.resolve(false);
					return new Promise<boolean>((r, j) => {
						fs.stat(v, (e, s) => {
							if (e) {
								r(false);
								return;
							}
							r(s.isFile());
						});
					});
				},
			},
		},
		opts,
	);
}

export function ExistsDirPath(opts?: clsvld.ValidationOptions) {
	return clsvld.ValidateBy(
		{
			name: "ExistsDirPath",
			constraints: [],
			validator: {
				validate: (v, _args): Promise<boolean> => {
					if (typeof v !== "string") return Promise.resolve(false);
					return new Promise<boolean>((r, j) => {
						fs.stat(v, (e, s) => {
							if (e) {
								r(false);
								return;
							}
							r(s.isDirectory());
						});
					});
				},
			},
		},
		opts,
	);
}
