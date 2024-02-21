export declare class Hole<T> {
    private static insmap;
    private readonly name;
    private val;
    constructor(meta: ImportMeta, name: string);
    fill(v: T): void;
    expose(): T;
    get content(): T;
    static check(): void;
}
