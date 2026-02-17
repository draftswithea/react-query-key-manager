export type QueryKeyPart = string | number | boolean | object | undefined;

export function key<
  const Args extends any[],
  const Return extends readonly QueryKeyPart[],
>(fn: (...args: Args) => Return) {
  const wrapper = (...args: Args) => {
    if (args.length === 0) {
      return () => fn(...([] as any));
    }
    return fn(...args);
  };
  return wrapper as (...args: Args) => Return & (() => Return);
}

type KeyFunction = ReturnType<typeof key>;

type ValidateKeyMap<T> = {
  [K in keyof T]: T[K] extends KeyFunction
    ? T[K]
    : T[K] extends (...args: any[]) => any
      ? `ERROR: "${K & string}" must be wrapped with key() function. Example: ${K & string}: key((arg) => ["value"])`
      : T[K] extends object
        ? ValidateKeyMap<T[K]>
        : `ERROR: "${K & string}" must be either a key() function or a nested object`;
};

type ProcessKeyMap<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => R & (() => R)
    : T[K] extends object
      ? ProcessKeyMap<T[K]>
      : never;
};

const registry: Record<string, (...args: any[]) => any> = {};
const keyNames = new Set<string>();

function processNode<T extends Record<string, any>>(node: T): ProcessKeyMap<T> {
  const processed = {} as any;

  for (const key in node) {
    const value = node[key];
    if (typeof value === "function") {
      processed[key] = value;
    } else if (value && typeof value === "object") {
      processed[key] = processNode(value);
    }
  }

  return processed;
}

function registerKeys(prefix: string, node: Record<string, any>): void {
  for (const [key, value] of Object.entries(node)) {
    const fullKey = `${prefix}.${key}`;
    if (typeof value === "function") {
      registry[fullKey] = value;
    } else if (value && typeof value === "object") {
      registerKeys(fullKey, value);
    }
  }
}

export function defineQueryKeys<
  const Name extends string,
  const KeyMap extends Record<string, KeyFunction | object>,
>(name: Name, keyMap: KeyMap & ValidateKeyMap<KeyMap>): ProcessKeyMap<KeyMap> {
  if (keyNames.has(name)) {
    if (process.env.NODE_ENV !== "production") {
      const error = `Query key name "${name}" has already been registered.

This typically happens when:
1. You're calling defineQueryKeys() with the same name twice
2. Hot module reloading is re-executing the registration

To fix this:
- Use unique names for each defineQueryKeys() call
- In development, the duplicate registration will be ignored
- In production, ensure each key name is only registered once`;

      throw new Error(error);
    }
    return processNode(keyMap);
  }

  keyNames.add(name);
  const processed = processNode(keyMap);
  registerKeys(name, processed);

  return processed;
}
