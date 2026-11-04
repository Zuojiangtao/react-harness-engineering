import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const reactHooksRules = reactHooks.configs?.recommended?.rules ?? {}

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'contract/**',
      'openspec/**',
      // MSW 生成的 worker，不手工修改
      'public/mockServiceWorker.js',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      // boundaries 依赖 eslint-module-utils 解析 import；默认 Node resolver
      // 不认 tsconfig 的 @ 别名，也不会补 .ts 后缀，必须显式换成 TS resolver。
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.app.json'],
        },
      },
      'boundaries/elements': [
        // pattern 指向目录本身，才能同时覆盖 src/app/router.tsx 与
        // src/app/layout/AppLayout.tsx；带 /* 只会匹配下一级目录。
        { type: 'app', pattern: 'src/app' },
        { type: 'pages', pattern: 'src/pages' },
        { type: 'features', pattern: 'src/features/*', capture: ['feature'] },
        { type: 'shared', pattern: 'src/shared' },
      ],
    },
    rules: {
      ...reactHooksRules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [{ to: { element: { types: ['pages', 'features', 'shared'] } } }],
            },
            {
              from: { element: { type: 'pages' } },
              allow: [{ to: { element: { types: ['features', 'shared'] } } }],
            },
            {
              from: { element: { type: 'features' } },
              allow: [{ to: { element: { type: 'shared' } } }],
            },
            {
              from: { element: { type: 'shared' } },
              allow: [{ to: { element: { type: 'shared' } } }],
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: '网络请求统一走 src/shared/api/client.ts' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    },
  },
  {
    files: ['src/shared/api/client.ts', 'src/test/**', 'src/mocks/**', '**/*.config.ts'],
    rules: {
      'no-restricted-globals': 'off',
    },
  },
)
