## 决策基准

| #   | 决策点          | 最终选择                           |
| --- | ------------ | ------------------------------ |
| 1   | 仓库结构         | 组件库独立 repo + 主项目 monorepo      |
| 2   | 前台渲染策略       | Vike（SSR / SSG / CSR 按路由混合）    |
| 3   | 组件库 registry | GitHub Packages（公司私有）          |
| 4   | 后端位置         | 主 monorepo 内 `services/api` 子包 |
| 5   | 部署方式         | 单台 VPS + docker-compose        |

---
## Tech Stack

### Frontend — Storefront
- Vite + Vike
- React
- TypeScript
- Redux Toolkit
- React Query
- React Hook Form + Zod
- react-helmet-async

### Frontend — dashboard Dashboard
- Vite CSR
- TanStack Table
- Recharts
- TipTap

### UI Component Library
- Vite lib mode
- MUI
- Tailwind
- Storybook
- Chromatic
- Lucide React
- Changesets
- GitHub Packages

### Backend 
- Express
- Typescript
- Mongoose
- JWT + bcrypt
- BullMQ
- MongoDB Atlas
- Atlas Search
- Redis
- Cloudflare R2

### Infrastructure
- Docker + Docker Compose
- VPS
- Cloudflare CDN

### CI/CD
- GitHub Actions
- Lighthouse CI
- Vitest

### dev
- pnpm workspaces
- Turborepo
- ESLint + Prettier
- TypeScript strict mode

### Observability
- Sentry

## 仓库结构

```
GitHub Organization: trendyuniquellc
│
├── trendyuniquellc/ui                        ← Repo 1：组件库（独立发版）
│   └── 发布到 GitHub Packages
│       @trendyuniquellc/ui@x.y.z
│
└── trendyuniquellc/ecommerce                 ← Repo 2：主项目 monorepo
    ├── apps/
    │   ├── storefront/              ← Vike SSR 前台商城
    │   └── dashboard/                   ← Vite CSR 后台管理
    ├── services/
    │   └── api/                     ← Express + TypeScript API
    └── packages/
        ├── types/                   ← 共享 Zod schema + TS 类型
        └── tsconfig/                ← 共享 TypeScript 配置基础
```

### Repo 1：`trendyuniquellc/ui` 组件库

```
trendyuniquellc/ui/
├── src/
│   ├── components/
│   └── tokens/
├── .storybook/
└── .github/
   └── workflows/
```

### Repo 2：`trendyuniquellc/ecommerce` 主项目 Monorepo

```
trendyuniquellc/ecommerce/
├── apps/
│   ├── storefront/
│   │   ├── pages/
│   │   ├── components/
│   │   └── store/
│   │
│   └── dashboard/
│       └── src/
│           ├── pages/
│           └── store/
├── services/
│   └── api/
│       └── src/
│           ├── routes/
│           ├── middleware/
│           ├── models/
│           └── lib/
├── packages/
├── infra/
└── .github/
    └── workflows/

```

## 渲染规范

| 路由                | 渲染方式     | 原因                   |
| ----------------- | -------- | -------------------- |
| `/`               | SSG（预渲染） | 首页内容变化慢，构建时生成，CDN 直出 |
| `/products/:slug` | SSR      | Google 必须索引完整商品内容    |
| `/search`         | SSR      | 搜索结果页是 SEO 流量主入口     |
| `/cart`           | CSR      | 纯客户端状态，无需 SEO        |
| `/checkout`       | CSR      | 支付流程，无需 SEO          |
| `/orders/:id`     | CSR      | 登录后页面，无需 SEO         |
| `/account/*`      | CSR      | 用户私有页面，无需 SEO        |
| `/auth/*`         | CSR      | 登录注册，无需 SEO          |
## Dashboard - Vendor vs Admin 权限矩阵

|操作|Admin|Vendor|
|---|---|---|
|查看所有商品|✅|✅（仅自己）|
|上架 / 下架商品|✅|✅（仅自己）|
|修改库存|✅|✅（仅自己）|
|查看所有订单|✅|❌|
|修改订单状态|✅|✅（含自己商品的订单）|
|管理用户|✅|❌|

## 组件库规范
1. 类型安全的接口设计

```ts
// 每个组件导出独立 Props 类型
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (id: string) => void;
  loading?: boolean;
  variant?: 'grid' | 'list';
}
```

2. 组件文档 — Storybook + MDX

- 每个组件写 `*.stories.mdx`
- 集成 `storybook-addon-a11y` 做无障碍测试
- 自动部署 Storybook 到 GitHub Pages 作为设计手册

3. 测试覆盖

```
单元测试 (Vitest)     → 纯逻辑、Hooks
组件测试 (React Testing Library) → 交互、渲染
E2E (Playwright)      → 核心购买流程
```

4. 视觉回归 — Chromatic 每次 PR 自动对 Storybook 截图对比，防止 UI 意外破坏。
5. 版本管理：changesets
6. 主题可扩展

## a11y checklist
- Every interactive element must be reachable by keyboard and have a visible focus ring.
- Use semantic HTML (`<button>`, `<a>`, `<nav>`, `<main>`, etc.) — not `<div onClick>`.
- Provide `aria-label` or `aria-labelledby` when visual context is missing.
- MUI handles ARIA roles for composite widgets (modal, menu, etc.); do not override them without a clear reason.
- Run `@testing-library/jest-dom` a11y queries (`getByRole`, `getByLabelText`) in tests — avoid `getByTestId` for interactive elements.

## SEO 
- Components must support server-side rendering (no browser-only globals at module scope).
- Heading levels (`h1`–`h6`) must be managed by the consumer via props (`as="h2"`), not hard-coded.
- `<img>` wrappers must require an `alt` prop (mark it non-optional in `ImageProps`).
- Do not suppress hydration warnings; fix the root cause instead.

## 常用命令

## 详细文档
 - 数据库设计
 - API规范
 - 部署流程