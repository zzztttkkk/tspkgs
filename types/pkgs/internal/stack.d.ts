export declare class Stack<T> {
    private _top?;
    private _tail?;
    private _depth;
    empty(): boolean;
    peek(): T;
    push(v: T): void;
    pop(): T;
}
