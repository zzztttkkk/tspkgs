import test from "node:test";
import { reflection } from "../src/index.js";
import { equal, require_false, require_true, Namespace } from "./base.js";

const { IsClass, IsSubClassOf } = reflection;

const ns = new Namespace("reflection.classes");

class A {}

class B extends A {}

function C() {}

class D extends Map {}

test(ns.func(IsClass), () => {
	require_true(IsClass(A));
	require_true(IsClass(B));
	require_false(IsClass(C));
	require_true(IsClass(D));
	require_false(IsClass(Map));
});

test(ns.func(IsSubClassOf), () => {
	equal(IsSubClassOf(B, A), true);
	equal(IsSubClassOf(A, Object), true);
	require_true(IsSubClassOf(Number, Object));
});
