export type SqlStatement = {
  bind: (...values: unknown[]) => SqlStatement;
  run: () => Promise<unknown>;
  first: <T = unknown>() => Promise<T | null>;
  all: <T = unknown>() => Promise<{ results?: T[] }>;
};

export type SqlDatabase = {
  prepare: (query: string) => SqlStatement;
};
