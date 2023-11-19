export const isTruthy = <T>(x: T | false | undefined | null | "" | 0): x is T =>
  !!x;
