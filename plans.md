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
- Vite v6
- Vike v1
- React ^18.0
- TypeScript ^5.5
- Tailwind CSS v3（v4 删除了 `presets` API，暂锁定 v3 以兼容 `tailwind.preset.cjs`）
- TanStack Query（React Query）v5
- React Hook Form v7 + Zod v3
- Vike 原生 head 管理（`+Head.tsx` / `useConfig()`）
- `@emotion/server`（MUI SSR critical CSS 提取，`extractCriticalToChunks`）

#### 实现注意事项

- **Vike SSR + React Query**：需要在 `+onRenderHtml.tsx` 中创建 `QueryClient`，prefetch 数据后调用 `dehydrate(queryClient)` 并将结果序列化注入 HTML；在 `+onRenderClient.tsx` 中用 `HydrationBoundary` 恢复状态，避免客户端重复请求。

### Frontend — Dashboard
- Vite v6（CSR）
- TanStack Table v8
- Recharts v2
- TipTap v2

### UI Component Library
- tsup ^8.3
- MUI v6
- TypeScript ^5.5
- React ^18.0
- Style Dictionary v4（设计 token 单一数据源，派生 MUI / Tailwind / CSS 变量多格式产物）
- Storybook v8 + @storybook/test
- Chromatic
- Lucide React ^0.400
- Changesets ^2
- GitHub Packages

### Backend
- Node.js v22 LTS
- Express v5
- TypeScript ^5.5
- Mongoose v8
- jsonwebtoken v9 + bcrypt v5
- BullMQ v5
- MongoDB Atlas（服务，无固定版本）
- Atlas Search（同上）
- Redis v7（服务端）+ ioredis ^5（客户端）
- Cloudflare R2（服务，无固定版本）

### Infrastructure
- Docker + Docker Compose
- VPS
- Cloudflare CDN

### CI/CD
- GitHub Actions
- Lighthouse CI（storefront）
- Vitest
- Chromatic（每次 PR）

### Dev
- pnpm v9（workspaces）
- Turborepo v2
- ESLint v9（flat config）
- Prettier v3
- TypeScript ^5.5（strict mode）

### Observability
- Sentry ^8

## 仓库结构

```
GitHub Organization: trendyuniquellc
│
├── trendyuniquellc/ui-library                        ← Repo 1：组件库（独立发版）
│   └── 发布到 GitHub Packages
│       @trendyuniquellc/ui-library@x.y.z
│
└── trendyuniquellc/ecommerce-platform                 ← Repo 2：主项目 monorepo
    ├── apps/
    │   ├── storefront/              ← Vike SSR 前台商城
    │   └── dashboard/                   ← Vite CSR 后台管理
    ├── services/
    │   └── api/                     ← Express + TypeScript API
    └── packages/
        ├── types/                   ← 共享 Zod schema + TS 类型
        └── tsconfig/                ← 共享 TypeScript 配置基础
```

### Repo 1：`trendyuniquellc/ui-library` 组件库

```
trendyuniquellc/ui-library/
├── src/
│   ├── components/
│   └── tokens/
├── .storybook/
└── .github/
   └── workflows/
```

### Repo 2：`trendyuniquellc/ecommerce-platform` 主项目 Monorepo

```
trendyuniquellc/ecommerce-platform/
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

1. Provider 设计

   组件库导出 `TrendyUIProvider`，消费方在 app 根节点使用一次。内部同时处理 `StyledEngineProvider injectFirst` + `CacheProvider`：

   - storefront SSR：传入自建的 emotion cache，自行做 critical CSS 提取；组件库不接管 SSR
   - dashboard CSR：不传，使用默认 cache

   > **注意：`dist/tailwind.preset.cjs` 由 Style Dictionary 直接输出，不经过 tsup。**
   > `package.json` 的 `files` 字段必须显式包含该文件（及 `dist/tokens.json`、`dist/tokens.css`），
   > 且 `exports` 中 `./tailwind.preset` 需用 `"require"` 条件（`tailwind.config.js` 是 CJS 上下文）：
   >
   > ```json
   > "./tailwind.preset": { "require": "./dist/tailwind.preset.cjs" }
   > ```

2. 类型安全的接口设计

   ```ts
   // 每个组件导出独立 Props 类型
   export interface ProductCardProps {
     product: Product;
     onAddToCart?: (id: string) => void;
     loading?: boolean;
     variant?: 'grid' | 'list';
   }
   ```

3. 组件文档 — Storybook + MDX

   - 每个组件写 `*.stories.tsx`（CSF）+ `*.mdx`（文档）分离格式
   - 集成 `storybook-addon-a11y` 做无障碍测试
   - 自动部署 Storybook 到 GitHub Pages 作为设计手册

4. 测试覆盖

   ```text
   单元测试 (Vitest v2)                      → 纯逻辑、Hooks
   组件测试 (React Testing Library ^16)      → 交互、渲染
   交互测试 (@storybook/test，Storybook v8)  → Storybook interaction testing
   视觉回归 (Chromatic)                      → Storybook 截图对比
   E2E (Playwright)                          → 核心购买流程（属于 storefront，不在本仓库）
   ```

   > **注意：`@testing-library/jest-dom` matchers 需要手动挂载到 Vitest。**
   > `vitest.config.ts` 中配置 `test.setupFiles: ['./vitest.setup.ts']`，
   > 并在 `vitest.setup.ts` 中 `import '@testing-library/jest-dom'`，
   > 否则 `toBeInTheDocument()` 等断言在运行时会报错。

5. 视觉回归 — Chromatic 每次 PR 自动对 Storybook 截图对比，防止 UI 意外破坏。

6. 版本管理：Changesets

7. 主题可扩展

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

## 本地联调方案

ui-library 是独立 repo，ecommerce-platform 通过 GitHub Packages 消费已发布版本。本地同时修改组件库和消费方时，使用 `pnpm link` 建立符号链接，无需发布即可联调。

**步骤：**

```bash
# 1. 在 ui-library 根目录构建并注册全局 link
cd path/to/ui-library
pnpm build
pnpm link --global

# 2. 在消费方目录（storefront 或 dashboard）链接本地版本
cd path/to/ecommerce-platform/apps/storefront
pnpm link --global @trendyuniquellc/ui-library
```

**联调结束后，恢复线上版本：**

```bash
# 在消费方目录取消 link，恢复 package.json 中的版本
pnpm unlink @trendyuniquellc/ui-library
pnpm install
```

**注意事项：**

- ui-library 的 `pnpm build` 需在每次修改后重新执行，link 本身不会热更新
- storefront 的 Vike dev server 需重启才能感知重新构建的产物
- 联调完成后务必及时 `unlink`，避免消费方意外引用本地路径

## 常用命令

## 详细文档

- 数据库设计
- API 规范
- 部署流程
