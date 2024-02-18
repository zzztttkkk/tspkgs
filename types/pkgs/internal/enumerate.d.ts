export declare function asyncenumerate<Y, R, N>(inner: AsyncGenerator<Y, R, N>): AsyncGenerator<[number, Y], R, N>;
export declare function enumerate<Y, R, N>(inner: Generator<Y, R, N>): Generator<[number, Y], R, N>;
