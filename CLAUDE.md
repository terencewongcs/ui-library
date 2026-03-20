 1. 用中文回答
 2. 称呼规则：每次回复前必须使用"Teri"作为称呼。 
 3. 决策确认：遇到不确定的代码设计问题时，必须先询问 Teri，不得直接行动。 
 4. 代码兼容性：不能写兼容性代码，除非我主动要求。
 5. 写完代码后，列出边缘情况和测试用例

---

## 项目背景

本仓库是 `trendyuniquellc/ui-library`，为 TrendyUnique LLC 电商平台的**独立组件库**，发布为 `@trendyuniquellc/ui` 到 GitHub Packages（私有）。消费方有两个：
- **storefront**（Vike SSR/SSG/CSR 混合渲染）— 对 SSR 兼容性要求严格
- **dashboard**（Vite CSR）— 后台管理面板

## Tech Stack

- **构建**：tsup ^8.3
- **UI 基础**：MUI（Material UI）v6
- **图标**：Lucide React ^0.400
- **语言**：TypeScript ^5.5（strict mode）
- **设计 Token**：Style Dictionary v4
- **文档**：Storybook v8，`*.stories.tsx`（CSF）+ `*.mdx`（文档）分离格式，自动部署到 GitHub Pages
- **测试**：Vitest v2、React Testing Library ^16（组件交互）
- **视觉回归**：Chromatic（每次 PR 自动截图对比）
- **版本管理**：Changesets ^2
- **CI/CD**：GitHub Actions
- **Node.js**：v22 LTS
- **React**：^18.0

## 目录结构

```
src/
├── components/   # 所有 UI 组件
└── tokens/       # Style Dictionary 源文件（*.sd.json）
.storybook/
.github/workflows/
```

## 组件开发规范

1. **Props 类型**：每个组件必须导出独立具名 `interface`，命名为 `{ComponentName}Props`。
2. **TypeScript strict**：不得使用 `any`，不得绕过类型检查。
3. **SSR 兼容**：禁止在模块作用域直接访问 `window` / `document` 等浏览器全局变量；需要时用条件判断或 `useEffect`。
4. **heading 层级**：标题层级由消费方通过 prop（如 `as="h2"`）控制，组件内不硬编码。
5. **图片**：`alt` prop 必须为非可选（`ImageProps` 中强制要求）。
6. **不覆盖 MUI ARIA**：MUI 对 modal、menu 等复合组件已内置 ARIA 角色，无充分理由不得覆盖。
7. **不写兼容性代码**：除非 Teri 主动要求。

## Design Tokens

使用 **Style Dictionary** 管理所有设计 token，token 源文件为平台无关格式，构建时派生多种产物：

```
src/tokens/*.sd.json        ← 唯一数据源（breakpoints、colors、spacing、typography 等）
        ↓ style-dictionary build
dist/tokens.json            ← MUI theme 使用（数字，无单位）
dist/tailwind.preset.cjs    ← storefront tailwind.config.js 使用（带 'px' 字符串）
dist/tokens.css             ← CSS 自定义属性（供未来扩展）
```

规则：
- 所有 token 值只在 `src/tokens/` 中定义，禁止在组件代码或 MUI theme 中硬编码数值
- storefront 通过 `presets: [require('@trendyuniquellc/ui/tailwind.preset')]` 消费，无需手动转换单位
- **storefront 必须锁定 Tailwind CSS v3**：Tailwind v4 删除了 `presets` API，`tailwind.preset.cjs` 在 v4 中无法使用；storefront 的 `package.json` 需固定 `"tailwindcss": "^3.x"`
- `package.json` `exports` 字段须同时暴露 `./tokens.json` 和 `./tailwind.preset`
- Style Dictionary 构建在 tsup 构建之前运行

> **注意：`dist/tailwind.preset.cjs` 由 Style Dictionary 直接输出，不经过 tsup 处理。**
> 必须在 `package.json` 的 `files` 字段中显式包含 `dist/tailwind.preset.cjs`（以及 `dist/tokens.json`、`dist/tokens.css`），否则 `npm publish` 时这些文件会被漏掉，消费方无法 `require`。
> 同时 `exports` 中 `./tailwind.preset` 条目需使用 `"require"` 条件，因为 `tailwind.config.js` 是 CommonJS 上下文：
> ```json
> "./tailwind.preset": {
>   "require": "./dist/tailwind.preset.cjs"
> }
> ```

## Provider

组件库导出 `TrendyUIProvider`，消费方在 app 根节点使用一次：

```tsx
export interface TrendyUIProviderProps {
  emotionCache?: EmotionCache; // SSR 消费方（如 storefront）传入自己的 cache
  children: React.ReactNode;
}
```

- Provider 内部同时处理 `StyledEngineProvider injectFirst` + `CacheProvider`
- storefront SSR：自行创建 `createCache({ key: 'css', prepend: true })`，传入 Provider，自行做 critical CSS 提取
- dashboard CSR 或其他消费方：不传，使用内置默认 cache
- 组件库不接管 SSR，不导出 SSR 工具函数

## Reusability & Extensibility
- MUI slots / slotProps  每个组件暴露 slots 和 slotProps，允许替换内部子组件

## Responsive & Cross-Platform Consistency
- 主题断点统一: 所有响应式逻辑用 MUI theme.breakpoints，禁止硬编码 @media px 值
- 相对单位: 间距用 theme.spacing()，字号用 rem，禁止组件内写固定 px 尺寸
- Storybook viewport addon: 每个组件 Story 覆盖 mobile / tablet / desktop 三个视口

## Customization
- 根元素接受 className，方便消费方用 Tailwind 或自定义 CSS 叠加
- 组件库内部不使用 Tailwind；Tailwind 仅供消费方在组件外部叠加样式

## a11y 要求

- 所有交互元素必须可键盘访问，且有可见焦点环。
- 使用语义化 HTML（`<button>`、`<a>`、`<nav>` 等），禁用 `<div onClick>`。
- 缺少视觉上下文时提供 `aria-label` 或 `aria-labelledby`。
- 测试中优先使用 `getByRole`、`getByLabelText`，避免用 `getByTestId` 测试交互元素。

## 测试规范

| 层级 | 工具 | 覆盖范围 |
|------|------|----------|
| 单元测试 | Vitest v2 | 纯逻辑、自定义 Hooks |
| 组件测试 | React Testing Library ^16 | 渲染、交互、a11y |
| 交互测试 | @storybook/test（Storybook v8 内置） | Storybook interaction testing |
| 视觉回归 | Chromatic | Storybook 截图对比 |

E2E 测试（如购买流程）属于消费方（storefront）的职责，不在本仓库。

> **注意：`@testing-library/jest-dom` matchers（如 `toBeInTheDocument()`）需要在 Vitest 中手动配置才能使用。**
> 在 `vitest.config.ts` 中添加：
> ```ts
> test: {
>   setupFiles: ['./vitest.setup.ts'],
> }
> ```
> 并在 `vitest.setup.ts` 中：
> ```ts
> import '@testing-library/jest-dom';
> ```
> 否则 RTL 的 a11y 断言在运行时会报 `toBeInTheDocument is not a function`。

## Storybook 规范

- 每个组件配套 `*.stories.tsx`（CSF story 定义）+ `*.mdx`（文档说明），分离格式。
- 集成 `storybook-addon-a11y` 进行无障碍检测。

## 依赖管理

- `react`、`react-dom`、`@mui/material`、`@emotion/react`、`@emotion/styled` 必须列为 `peerDependencies`，不得放入 `dependencies`
- 本地开发所需的上述依赖同时列入 `devDependencies`
- tsup 的 `external` 配置必须与 `peerDependencies` 保持一致，确保构建产物不打包这些依赖
- 原因：列为 `dependencies` 会导致消费方出现两份 React/MUI 实例，引发 Hook 报错、MUI 主题断层、bundle 体积膨胀

## 发版流程

使用 **Changesets** 管理版本号和 changelog，不得手动修改 `package.json` 版本字段。
