#!/usr/bin/env node
/**
 * 架构边界负向门禁：确保“违规的跨 feature / 反向依赖”真的会让 ESLint 变红。
 * 只跑 eslint . 不够，因为 alias 或无后缀导入一旦解析失败，boundaries 会静默跳过。
 */
import { ESLint } from 'eslint'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const eslint = new ESLint({ cwd: root })

const cases = [
  {
    name: 'features/orders -> features/customers（@ 别名）',
    file: 'src/features/orders/__boundary_probe.ts',
    source: "import { customersApi } from '@/features/customers/api'\nexport const probe = customersApi\n",
  },
  {
    name: 'features/orders -> features/customers（无后缀相对路径）',
    file: 'src/features/orders/__boundary_probe.ts',
    source: "import { customersApi } from '../customers/api'\nexport const probe = customersApi\n",
  },
  {
    name: 'shared/api -> features/customers（@ 别名）',
    file: 'src/shared/api/__boundary_probe.ts',
    source: "import { customersApi } from '@/features/customers/api'\nexport const probe = customersApi\n",
  },
  {
    name: 'shared/api -> features/customers（无后缀相对路径）',
    file: 'src/shared/api/__boundary_probe.ts',
    source: "import { customersApi } from '../../features/customers/api'\nexport const probe = customersApi\n",
  },
  {
    name: 'pages -> app（@ 别名）',
    file: 'src/pages/__boundary_probe.ts',
    source: "import { router } from '@/app/router'\nexport const probe = router\n",
  },
  {
    name: 'features -> app（@ 别名）',
    file: 'src/features/orders/__boundary_probe.ts',
    source: "import { router } from '@/app/router'\nexport const probe = router\n",
  },
]

let failed = 0
for (const testCase of cases) {
  const [result] = await eslint.lintText(testCase.source, {
    filePath: join(root, testCase.file),
  })
  const boundaryErrors = result.messages.filter(
    (message) => message.ruleId === 'boundaries/dependencies',
  )
  if (boundaryErrors.length === 0) {
    failed += 1
    console.error(`FAIL ${testCase.name}: boundaries/dependencies 没有报错`)
  } else {
    console.log(`PASS ${testCase.name}`)
  }
}

if (failed > 0) {
  console.error(`\n${failed} 个架构边界用例没有被拦截`)
  process.exit(1)
}
console.log(`\n架构边界负向用例 ${cases.length}/${cases.length} 全部被拦截`)
