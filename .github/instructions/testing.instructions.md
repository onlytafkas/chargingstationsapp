---
description: Rules for writing and maintaining tests in the project. Always read this file before implementing or modifying any code — tests and coverage checks are mandatory for every change.
applyTo: "**"
---

# Testing Guidelines

## Core Requirement

**MANDATORY — read and apply these rules for every code change, no exceptions.**

- Every new piece of business logic MUST have **both unit tests and integration tests** written before or alongside the implementation.
- Tests must be **meaningful**: each test asserts real behaviour and covers a distinct scenario. Never write tests that exist only to inflate coverage numbers.
- Tests are not optional and must pass before any change is considered complete.

After **every** code change (no exceptions):
1. Run the full unit test suite to confirm no regressions — `npm run test`
2. Run the integration test suite — `npm run test:integration`
3. Run coverage to confirm thresholds are maintained — `npm run test:coverage`
4. If coverage drops below 80% on any business-logic file, add meaningful tests to restore it before finishing.

---

## Coverage Thresholds

The project targets **80% minimum on all four metrics** (Statements, Branches, Functions, Lines) for every business logic file:

| Layer | Target |
|---|---|
| `app/dashboard/actions.ts` | ≥ 80% Stmts / Branch / Funcs / Lines |
| `data/*.ts` | ≥ 80% (aim for 100%) |
| `components/*.tsx` (business components) | ≥ 80% |

**Exempt from coverage requirements** — do not write tests for these:
- `db/schema.ts` — Drizzle ORM relation definitions, no testable application logic
- `components/ui/*.tsx` — shadcn/ui passthrough wrappers (button, table, dialog, etc.)
- `app/layout.tsx`, `app/globals.css` — infrastructure, not business logic

---

## Test Tooling

- **Test runner**: Vitest v4
- **Component testing**: `@testing-library/react` + `@testing-library/user-event`
- **Coverage provider**: `@vitest/coverage-v8`

### Commands

```bash
npm run test              # Run all unit tests once (CI mode)
npm run test:watch        # Watch mode during development
npm run test:integration  # Run integration tests against pg-mem
npm run test:coverage     # Run all unit tests + generate coverage report
npm run test:ui           # Open the Vitest browser UI
```

---

## File & Directory Structure

Mirror the source tree under `__tests__/` for unit tests and under `__tests__/integration/` for integration tests:

```
__tests__/
  components/            ← unit tests for components/
  dashboard/             ← unit tests for app/dashboard/
  data/                  ← unit tests for data/
  helpers/               ← shared test helper utilities
  mocks/                 ← shared vi.mock factory modules
  integration/
    data/                ← integration tests for data/
    actions/             ← integration tests for app/dashboard/actions.ts
    flows/               ← cross-entity integration flows
    helpers/
      test-db.ts         ← shared pg-mem instance + backup/restore helpers
```

**Naming**:
- Unit tests: source file name + `.test.ts` / `.test.tsx`  
  Example: `data/loading-sessions.ts` → `__tests__/data/loading-sessions.test.ts`
- Integration tests: source file name + `.integration.test.ts`  
  Example: `data/loading-sessions.ts` → `__tests__/integration/data/loading-sessions.integration.test.ts`

---

## Mocking Pattern (vi.hoisted + vi.mock)

All mocks **must** use `vi.hoisted()` so variables are available inside `vi.mock()` factory functions. This is required for ESM compatibility with Vitest.

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. Hoist mock variables FIRST — before any module imports
const { mockGetUserInfo, mockCreateStation } = vi.hoisted(() => ({
  mockGetUserInfo: vi.fn(),
  mockCreateStation: vi.fn(),
}));

// 2. Declare vi.mock() calls — hoisted by Vitest to before all imports
vi.mock("@/data/usersinfo", () => ({
  getUserInfo: mockGetUserInfo,
}));

vi.mock("@/data/stations", () => ({
  createStation: mockCreateStation,
}));

// 3. Import the module under test AFTER mock declarations
import { createStationAction } from "@/app/dashboard/actions";
```

### Standard mocks to always include for server action tests

```typescript
// Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(async () => ({ userId: mockAuthUserId.value })),
}));

// next/headers (required by actions.ts)
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: vi.fn(() => null) })),
}));

// next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
```

### Database mock chain pattern (for data layer tests)

```typescript
const mockDb = {
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    }),
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1 }]),
      }),
    }),
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  }),
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  }),
};

vi.mock("@/db", () => ({ db: mockDb }));
```

---

## What to Test for Each Layer

### Data functions (`data/*.ts`)

Every exported function needs **both** a unit test and an integration test.

**Unit test** (mocked DB — `__tests__/data/`):
- **Happy path**: correct input → expected return value
- **Not found**: query returns empty array → function returns `null` or `[]`
- **Edge cases**: `null`/`undefined` optional fields, empty string treated as `null`

**Integration test** (real pg-mem DB — `__tests__/integration/data/`):
- **Real SQL correctness**: the generated SQL runs without error
- **Constraints**: UNIQUE, FK, and NOT NULL constraints behave as expected
- **Ordering / filtering**: ORDER BY, WHERE clauses return the right rows
- **Relationships**: any join or relation loading works end-to-end

```typescript
// Integration test pattern for data functions
vi.mock("@/db", async () => await import("@/__tests__/integration/helpers/test-db"));
import { mem, emptyBackup } from "@/__tests__/integration/helpers/test-db";

let backup: ReturnType<typeof mem.backup>;
beforeAll(() => { emptyBackup.restore(); backup = mem.backup(); });
afterAll(() => { emptyBackup.restore(); });
beforeEach(() => { backup.restore(); });
```

```typescript
describe("getStationById", () => {
  it("returns the station when found", async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([station]) }) });
    expect(await getStationById("1")).toEqual(station);
  });

  it("returns null when not found", async () => {
    mockDb.select.mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });
    expect(await getStationById("999")).toBeNull();
  });
});
```

### Server actions (`app/dashboard/actions.ts`)

Every server action needs **both** a unit test and an integration test.

**Unit test** (mocked DB + mocked data layer — `__tests__/dashboard/`):
1. **Unauthenticated** — `userId` is null → returns `{ error: "Unauthorized" }`
2. **Non-admin / insufficient permission** — returns appropriate error
3. **Validation error** — invalid input → returns `{ error: "..." }`
4. **Resource not found** — returns `{ error: "... not found" }`
5. **Success** — valid input + correct role → returns `{ success: true, data: ... }`
6. **DB error path** — data layer throws → returns `{ error: "Failed to ..." }`

**Integration test** (real pg-mem DB, only Clerk/next mocked — `__tests__/integration/actions/`):
1. **Auth guard** — unauthenticated returns correct error
2. **Permission guard** — non-admin forbidden
3. **Success + DB persist** — row actually exists in the DB after the action
4. **Audit log written** — correct audit entry in `audit_logs` table
5. **Constraint / business rule** — duplicate names, cooldown, overlap, etc.

```typescript
// Integration action test: only mock auth and Next.js infra
vi.mock("@/db", async () => await import("@/__tests__/integration/helpers/test-db"));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: mockUserId.value })) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => ({ get: vi.fn(() => null) })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
```

### React components (`components/*.tsx`)

Every business component must test:
1. **Renders correctly** — key UI elements are present
2. **User interactions** — button clicks, form submissions, dialog open/close
3. **Cancel / dismiss** — every Cancel button's `onClick` closes the dialog
4. **Conditional rendering** — props that toggle visibility or content
5. **Accessibility** — labels and ARIA attributes are present

```typescript
it("closes the dialog when Cancel is clicked", async () => {
  const user = userEvent.setup();
  render(<MyDialog {...props} />);
  await user.click(screen.getByRole("button", { name: /open/i }));
  await user.click(screen.getByRole("button", { name: /cancel/i }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
```

---

## beforeEach Reset Pattern

Always reset mocks between tests to prevent state leakage:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUserId.value = "user_test123"; // reset to a valid logged-in user
  // reset any other stateful mock defaults here
});
```

---

## Test Quality Rules

1. **Meaningful tests only** — every test must assert real, observable behaviour. A test that only checks "it didn't throw" or duplicates an already-covered path has no value and must not be added.
2. **Cover all branches** — aim for 100% branch coverage on data functions and server actions. For each `if`/`else`, `try`/`catch`, and ternary in business logic, there should be at least one test exercising each path.
3. **No snapshots** — use explicit `expect(x).toEqual(y)` assertions
4. **Test behaviour, not implementation** — do not test internal function calls unless they represent side effects (e.g., audit log was written, revalidatePath was called)
5. **One concept per test** — keep each `it()` focused on a single scenario
6. **Descriptive names** — write test names as sentences: `"returns error when station is not found"`
7. **No dead coverage** — do not spy or call a function just to move a line into the covered set without asserting its return value or side effect

---

## Integration Test Infrastructure

The project uses **pg-mem** (in-memory PostgreSQL) for integration tests. Key facts:

- Config: `vitest.integration.config.ts` (separate from the unit test config)
- Shared DB helper: `__tests__/integration/helpers/test-db.ts`
  - Exports `db` (Drizzle instance), `mem` (pg-mem instance), `emptyBackup` (clean-schema snapshot)
  - Mock `@/db` with `vi.mock("@/db", async () => await import("@/__tests__/integration/helpers/test-db"))` at the top of every integration test file
- **Isolation pattern** — every integration test file must use:
  ```typescript
  let backup: ReturnType<typeof mem.backup>;
  beforeAll(() => { emptyBackup.restore(); /* seed */; backup = mem.backup(); });
  afterAll(() => { emptyBackup.restore(); });
  beforeEach(() => { backup.restore(); });
  ```
- **Known pg-mem limitation**: `LEFT JOIN LATERAL` (used by drizzle's `with:` relation loading) is not supported. Skip those tests with `it.skip` and a comment, and rely on unit tests for relation-loading coverage.
- **Timezone**: pg-mem returns timestamps as UTC strings. Use `getUTCHours()` / `getUTCMinutes()` in assertions, never `getHours()` / `getMinutes()`.

---

## Checklist — Required Before Finishing Any Change

Run through this checklist for **every** code change — not only new features:

- [ ] Identified every new or modified code path (branches, conditionals, error paths)
- [ ] Wrote a **meaningful unit test** for each identified path — happy path, error path, edge cases
- [ ] Wrote a **meaningful integration test** for each new data function and server action
- [ ] Wrote unit tests for every new business component in `components/`
- [ ] Ran `npm run test` — all unit tests pass (0 failures)
- [ ] Ran `npm run test:integration` — all integration tests pass (0 failures)
- [ ] Ran `npm run test:coverage` — all business logic files remain at ≥ 80% Stmts / Branch / Funcs / Lines
- [ ] Coverage did not drop compared to before the change; if it did, added tests to restore or exceed the previous level
- [ ] No existing tests were broken by the change
