# CLAUDE.md — @trendyunique/ui-library

UI component library built on React 18 + MUI + Tailwind CSS, published as an ESM/CJS dual package.

---

## Stack

| Layer | Tool |
|-------|------|
| Language | TypeScript 5.6.x(`strict: true`) |
| Framework | React 19.x|
| Base components | MUI 6.x|
| Styling | Tailwind CSS 4.x|
| Build | Vite 6.x + vite-plugin-dts  4.x|
| Test | Vitest 2.x + Testing Library |
| Docs | Storybook 8.x|
| Release | Changesets 11.x|

- Node.js  22.x LTS
- @emotion/react 11.x
- eslint 9.x 
- prettier  3.x 
---

## TypeScript — Strict Mode

`tsconfig.json` enforces `strict: true`, `noUnusedLocals`, `noUnusedParameters`.
**Never disable or loosen these flags.**

- Prefer explicit return types on all exported functions and hooks.
- No `any`. Use `unknown` and narrow, or define a precise type.
- No non-null assertions (`!`) unless you can prove safety in a comment.
- Use `satisfies` to validate literals against a type without widening.

---

## Props Convention

Every component must define and export a named `*Props` interface.

```ts
// Good
export interface ButtonProps
  extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}
```

Rules:
- Extend the underlying HTML element props or MUI props via `Omit` — never copy-paste native props manually.
- Mark optional props with `?`; required props are implicit.
- Document each non-obvious prop with a JSDoc `/** */` comment on the line above it.
- Export all public `type` aliases (`ButtonVariant`, `ButtonSize`, etc.) alongside the interface.

---

## Hooks & Return Types

- Always annotate the return type explicitly:
  ```ts
  function useDisclosure(): { isOpen: boolean; open: () => void; close: () => void }
  ```
- Return a plain object (not an array) when there are ≥ 2 values, so callers can destructure by name.
- Keep hooks pure — no side effects outside `useEffect`.

---

## Public API — Controlled & Unified

Each component is barrel-exported from its `index.ts`, then re-exported from `src/index.ts`.

```
src/
  components/
    Button/
      Button.tsx        ← implementation
      Button.styles.ts  ← Tailwind class maps
      Button.stories.tsx
      Button.test.tsx
      index.ts          ← export { Button } + export type { ButtonProps, ... }
  index.ts              ← single public entry point
```

Rules:
- **Only** export what consumers need. Internal helpers stay un-exported.
- Add a named export to `package.json#exports` for every new component (tree-shaking support).
- Never export default — named exports only.
- Breaking API changes require a Changeset entry (`npm run changeset`).

---

## Reusability & Extensibility

- **`forwardRef`** on every component that renders a DOM element — consumers must be able to attach refs.
- **`className` prop** on every component — allows one-off Tailwind overrides without forking.
- Style maps (e.g., `Button.styles.ts`) are separated from logic so themes can be swapped independently.
- Prefer composition over configuration: expose `startIcon`/`endIcon`/`children` slots rather than bespoke boolean flags.

---

## Responsive & Cross-Platform Consistency

- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) for layout; never hard-code pixel breakpoints in JS.
- Tailwind config (`tailwind.config.js`) is the single source of breakpoints and design tokens.
- Test all new components at `375px`, `768px`, and `1440px` viewport widths in Storybook.
- Avoid fixed heights/widths that break on small screens; use `min-h`, `max-w`, and relative units.

---

## Accessibility (a11y)

- Every interactive element must be reachable by keyboard and have a visible focus ring.
- Use semantic HTML (`<button>`, `<a>`, `<nav>`, `<main>`, etc.) — not `<div onClick>`.
- Provide `aria-label` or `aria-labelledby` when visual context is missing.
- MUI handles ARIA roles for composite widgets (modal, menu, etc.); do not override them without a clear reason.
- Run `@testing-library/jest-dom` a11y queries (`getByRole`, `getByLabelText`) in tests — avoid `getByTestId` for interactive elements.

---

## SEO Friendliness

- Components must support server-side rendering (no browser-only globals at module scope).
- Heading levels (`h1`–`h6`) must be managed by the consumer via props (`as="h2"`), not hard-coded.
- `<img>` wrappers must require an `alt` prop (mark it non-optional in `ImageProps`).
- Do not suppress hydration warnings; fix the root cause instead.

---

## Customization

Components support three customization layers, in order of preference:

1. **Props** — `variant`, `size`, `disabled`, slots (`startIcon`, etc.)
2. **`className` prop** — append Tailwind utilities for one-off overrides
3. **MUI `sx` prop / theme** — for deep MUI token overrides at app level

Do not expose raw CSS-in-JS `sx` on new components by default; consumers can access it via the spread `...rest` if the base MUI component supports it.

---

## Commands

```bash
npm run dev            # Storybook dev server (port 6006)
npm run test           # Vitest (single run)
npm run test:watch     # Vitest watch
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run build          # Production build + type declarations
npm run changeset      # Document a breaking/minor/patch change
npm run release        # Build + publish to npm
```

---

## Checklist for Every New Component

- [ ] `*Props` interface exported from component file
- [ ] `forwardRef` wrapping with correct generic types
- [ ] `displayName` set (`Component.displayName = 'Component'`)
- [ ] `className` prop accepted and merged
- [ ] Responsive behavior verified at 375 / 768 / 1440 px
- [ ] Keyboard navigation works; focus ring visible
- [ ] ARIA attributes correct
- [ ] Unit tests covering default render, variants, and a11y roles
- [ ] Storybook story with all variants shown
- [ ] Barrel export added to `src/components/<Name>/index.ts` and `src/index.ts`
- [ ] Named export added to `package.json#exports`
- [ ] Changeset created if the change is user-facing