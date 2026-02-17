![Banner](/public/banner.png)

# React Query Key Manager

**Type-safe**, **composable**, and **collision-free** query key management for [`@tanstack/react-query`](https://tanstack.com/query).

```sh
pnpm add react-query-key-manager
# or
yarn add react-query-key-manager
# or
npm install react-query-key-manager
```

## Why?

Managing query keys in large React Query applications is painful:

- **Magic strings** scattered across your codebase
- **Key collisions** from multiple developers using the same strings
- **No type safety** for key parameters
- **Poor discoverability** — no single source of truth

React Query Key Manager solves these problems with a simple, type-safe API that catches errors at compile-time.

## Quick Start

```tsx
import { defineQueryKeys, key } from "react-query-key-manager";

// Define your query keys
export const userKeys = defineQueryKeys("user", {
  profile: key((userId: string) => ["user", "profile", userId]),
  settings: key((userId: string, section?: string) => [
    "user",
    "settings",
    userId,
    section,
  ]),
  list: key(() => ["user", "list"]),
});

// Use them with React Query
import { useQuery } from "@tanstack/react-query";

function UserProfile({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => fetchUserProfile(userId),
  });

  return <div>{data?.name}</div>;
}
```

## Features

### ✅ Type-Safe Parameters

Function parameters are strictly typed and validated:

```ts
userKeys.profile("123"); // ✅ Works
userKeys.profile(); // ❌ Error: missing userId
userKeys.profile(123); // ❌ Error: userId must be string
```

### ✅ Enforced Best Practices

All query key functions must be wrapped with `key()`:

```ts
defineQueryKeys("user", {
  profile: (userId: string) => ["user", "profile", userId],
  // ❌ Error: "profile" must be wrapped with key() function.
  // Example: profile: key((arg) => ["value"])
});
```

### ✅ Collision Prevention

Duplicate key names are caught in development:

```ts
defineQueryKeys("user", {
  /* ... */
});
defineQueryKeys("user", {
  /* ... */
});
// ❌ Runtime Error: Query key name "user" has already been registered
```

### ✅ Nested Namespaces

Organize keys hierarchically for large applications:

```ts
export const adminKeys = defineQueryKeys("admin", {
  users: {
    list: key((page: number) => ["admin", "users", "list", page]),
    detail: key((id: string) => ["admin", "users", "detail", id]),
  },
  settings: {
    general: key(() => ["admin", "settings", "general"]),
  },
});

// Usage
adminKeys.users.list(1); // ["admin", "users", "list", 1]
```

### ✅ Key Composition

Compose keys by calling them with `()`:

```ts
const postKeys = defineQueryKeys("post", {
  detail: key((postId: string) => ["post", "detail", postId]),
});

const extendedPostKeys = defineQueryKeys("post.extended", {
  withAuthor: key((postId: string, authorId: string) => [
    ...postKeys.detail(postId)(),
    "author",
    ...userKeys.profile(authorId)(),
  ]),
});

// Result: ["post", "detail", "123", "author", "user", "profile", "456"]
```

### ✅ Perfect IntelliSense

Get precise type information in your editor:

```ts
userKeys.profile("123");
// Type: readonly ["user", "profile", string]
```

## Advanced Usage

### Complex Filters

```ts
const postKeys = defineQueryKeys("post", {
  list: key(
    (filters: {
      category?: string;
      status?: "draft" | "published";
      page?: number;
    }) => ["posts", "list", filters],
  ),
});

// Fully typed
postKeys.list({ category: "tech", status: "published" });
```

### Dependent Queries

```ts
const dashboardKeys = defineQueryKeys("dashboard", {
  overview: key((userId: string) => [
    "dashboard",
    "overview",
    ...userKeys.profile(userId)(),
    ...postKeys.list({ status: "published" })(),
  ]),
});
```

## API Reference

### `defineQueryKeys(name, keyMap)`

Creates a namespaced collection of query keys.

**Parameters:**

- `name` (string) - Unique namespace identifier
- `keyMap` (object) - Object containing `key()` wrapped functions or nested objects

**Returns:** Typed key map with all functions ready to use

### `key(fn)`

Wraps a query key function to enable type inference and composition.

**Parameters:**

- `fn` (function) - Function that returns a query key array

**Returns:** Enhanced function that supports both direct calls and composition

## Migration from v0.0.113

Version 0.0.2 introduced breaking changes for better type safety and API simplicity.

### What Changed

- ❌ Removed `QueryKeyManager.create()` → Use `defineQueryKeys()`
- ❌ Removed `defineKey()` → Use `key()`
- ✅ All functions must be wrapped with `key()`

### Before (v0.0.113)

```ts
import { QueryKeyManager, defineKey } from "react-query-key-manager";

const userKeys = QueryKeyManager.create("user", {
  profile: defineKey((userId: string) => ["user", "profile", userId]),
  // or without defineKey (also worked)
  settings: (userId: string) => ["user", "settings", userId],
});
```

### After (v0.0.2+)

```ts
import { defineQueryKeys, key } from "react-query-key-manager";

const userKeys = defineQueryKeys("user", {
  profile: key((userId: string) => ["user", "profile", userId]),
  settings: key((userId: string) => ["user", "settings", userId]),
});
```

### Migration Checklist

1. Replace `QueryKeyManager.create` → `defineQueryKeys`
2. Replace `defineKey` → `key`
3. Wrap all unwrapped functions with `key()`
4. Update imports

## Design Philosophy

- **Zero runtime overhead** — Pure TypeScript with no dependencies
- **Copy-pasteable** — ~60 lines you can vendor directly
- **Framework agnostic** — Works with any TypeScript project
- **Developer experience first** — Clear error messages and IntelliSense

## License

MIT

---

**Current Version:** 0.0.2  
**React Query Compatibility:** v4.x, v5.x  
**TypeScript:** 5.0+
