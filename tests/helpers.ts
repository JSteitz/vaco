export type Spy = {
  (...args: []): void;
  readonly callCount: number;
  readonly callArgs: [];
};

export const spy = (): Spy => {
  let callCount = 0;
  const callArgs: unknown[] = [];

  const fn = function(...args: []) {
    callCount += 1;
    callArgs[callCount] = args;
  };

  Object.defineProperties(fn, {
    callCount: { enumerable: true, get: () => callCount },
    callArgs: { enumerable: true, get: () => callArgs }
  });

  return fn as Spy;
};

export const noop = (): void => { /**/ };
