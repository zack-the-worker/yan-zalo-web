# Zalo Manager — Copilot Instructions

## Tech Stack

- **Next.js 15** App Router, TypeScript strict mode
- **Tailwind CSS v4**
- **Socket.io v4** (custom server via `server.ts` + `lib/socketServer.ts`)
- **zca-js v2** (unofficial Zalo API)
- Package manager: **npm** (not pnpm/yarn)

## Icons — Lucide Only

**All icons and icon-buttons must use [`lucide-react`](https://lucide.dev/icons/).**

- Import from `lucide-react`, e.g. `import { Search, LogOut, RefreshCw } from "lucide-react"`
- Never use emoji characters or raw SVG markup as UI icons
- Size props: use `className="w-4 h-4"` (Tailwind) rather than the `size` prop
- Do **not** install any other icon library

## Test-Driven Development (TDD)

Before writing any feature or fix, write a failing test first.

1. **Red** — write a test that describes the expected behavior and verifies it fails
2. **Green** — write the minimum code to make the test pass
3. **Refactor** — clean up without breaking tests

Run tests with `npm test` (configure Jest/Vitest if not yet set up). All new API routes, utility functions, and hooks must have corresponding tests.

## Code Principles

- **TypeScript First** — all new code in `.ts` / `.tsx`; `strict: true` is mandatory
- **DRY** — extract reusable logic into custom hooks (`useXxx`) or `lib/` utilities
- **One responsibility per function / component** — single level of abstraction per function
- **Pure functions preferred** — easier to test and reason about
- **Long, clear names** over short, vague names even at the cost of verbosity
- **No barrel files** (`index.ts` re-exports) — always import from the specific file

## Project Structure Conventions

```
app/                   # Next.js App Router pages + API routes
  api/                 # Route handlers (one concern per route)
  tien-ich/            # Utilities hub (layout.tsx handles shared auth guard + nav)
lib/                   # Server-side singletons and utilities
  zalo.ts              # Zalo login state + listeners
  messageStore.ts      # In-memory chat message store
  socketServer.ts      # Socket.io server singleton
types/                 # Shared TypeScript types and interfaces (not inside components)
```

- **Global singletons**: store on `globalThis.__xxx` to survive HMR (see `lib/zalo.ts` pattern)
- **Auth guard**: handled by `app/tien-ich/layout.tsx`; individual pages inside do **not** repeat auth checks
- **Collocate** component, types, and tests for a feature in the same folder

## React / Next.js Guidelines

- **Functional components + Hooks only** (no class components)
- **PascalCase** for component names, `camelCase` for props
- Destructure props in the function signature
- Define prop interfaces in `types/` — not inline inside a component file
- Use `next/image` for all `<img>` tags
- Use `next/link` for internal navigation (`<Link href=...>` not `<a href=...>`)
- Prefer Server Components for data fetching; use `"use client"` only when needed
- Always provide a stable, unique `key` prop in list renders (never array index for mutable lists)

## Styling

- Tailwind CSS v4 utility classes only
- Use `className` on all elements; never inline `style={{}}` unless unavoidable
- Tailwind v4 note: prefer `shrink-0` over `flex-shrink-0`

## API Routes

- One route file = one concern
- Validate inputs at the boundary; return typed JSON errors with appropriate HTTP status
- Never expose raw `Error` stack traces to the client
- Utilities API routes live under `app/api/utilities/`

## What NOT to Do

- ❌ Emoji or raw SVG as UI icons — use Lucide
- ❌ `npm install` a second icon library
- ❌ Write implementation before the test (violates TDD)
- ❌ Define types inside component files — put them in `types/`
- ❌ Use `index.ts` barrel files
- ❌ Use `pnpm` or `yarn` — this project uses `npm`
- ❌ Use `<img>` directly — use `next/image`
- ❌ Use `<a href>` for internal routes — use `next/link`

---

## Git Workflow — GitHub Stacked PRs (`gh stack`)

This project uses `gh stack` to break large features into small, reviewable PRs in a dependency chain rooted in `main`.

### Stack Layer Order

When planning a feature, split into layers bottom-up:

1. **Bottom** — Shared types, configs, schema
2. **Middle** — API routes, services, business logic
3. **Top** — UI components, tests, documentation

> Code in a layer may only depend on the **same or lower** layer — never higher.

### Common Commands

| Command | Purpose |
|---|---|
| `gh stack init` | Start a new stack |
| `gh stack init --adopt <b1> <b2>` | Adopt existing branches into a stack |
| `gh stack add <branch>` | Add a new branch on top |
| `gh stack add -Am "msg"` | Stage all + commit + create next branch |
| `gh stack view` | Show stack status and PR links |
| `gh stack submit` | Push all branches + create/update PRs |
| `gh stack sync` | Fetch + rebase + push + sync PRs |
| `gh stack rebase` | Cascading rebase across the full stack |
| `gh stack rebase --upstack` | Rebase only branches above current |
| `gh stack up / down / top / bottom` | Navigate stack layers |
| `gh stack checkout <branch>` | Jump to a specific layer |
| `gh stack unstack` | Remove stack for restructuring |

### Key Rules

1. **Plan layers before coding** — decide branch boundaries upfront
2. **One concern per branch** — focused enough to review independently
3. **Fix in the right layer** — make the change at the lowest applicable branch, then `gh stack rebase --upstack`
4. **Never `git push -f`** — always use `gh stack push` or `gh stack sync` (uses `--force-with-lease --atomic`)
5. **Run `gh stack sync`** after teammates merge PRs your stack depends on

### Making a Fix to a Lower Layer

```bash
gh stack down          # navigate to the branch that needs the fix
git add . && git commit -m "Fix: ..."
gh stack rebase --upstack   # propagate change through all branches above
gh stack top           # return to top
```

### After a PR at the Bottom Is Merged

```bash
gh stack sync          # fetches remote, fast-forwards trunk, rebases remaining branches
```
