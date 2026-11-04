#!/usr/bin/env node
/**
 * 规格门禁：
 * 1. openspec validate --all --strict（格式与结构）
 * 2. 需求 ID 追溯：每条 [XXX-00] 至少被一个测试/e2e 引用
 *
 * 开发期缺失只警告；收口时用 `node scripts/check-spec.mjs --strict` 作为硬门禁。
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractRequirementIds } from './spec-ids.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'
const strict = process.argv.includes('--strict')
const bin = join(root, 'node_modules', '.bin', isWindows ? 'openspec.cmd' : 'openspec')

if (!existsSync(bin)) {
  console.error('openspec CLI 未安装，先运行 pnpm install')
  process.exit(1)
}

const validated = spawnSync(bin, ['validate', '--all', '--strict'], {
  cwd: root,
  stdio: 'inherit',
  shell: isWindows,
  env: { ...process.env, OPENSPEC_TELEMETRY: '0' },
})
if (validated.status !== 0) {
  console.error('\nopenspec validate 失败')
  process.exit(validated.status ?? 1)
}

function walk(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return [full]
  })
}

const specFiles = [
  ...walk(join(root, 'openspec', 'changes')),
  ...walk(join(root, 'openspec', 'specs')),
].filter((file) => file.endsWith('spec.md'))

const ids = new Set()
for (const file of specFiles) {
  for (const id of extractRequirementIds(readFileSync(file, 'utf8'))) {
    ids.add(id)
  }
}

if (ids.size === 0) {
  console.error('没有找到需求 ID，规格里请使用 [CUS-01] 形式')
  process.exit(1)
}

const sourceFiles = [
  ...walk(join(root, 'src')).filter((file) => /\.(test|spec)\.(ts|tsx)$/.test(file)),
  ...walk(join(root, 'e2e')).filter((file) => file.endsWith('.ts')),
]
const sources = sourceFiles.map((file) => ({ file, content: readFileSync(file, 'utf8') }))

const missing = []
for (const id of ids) {
  if (!sources.some(({ content }) => content.includes(id))) missing.push(id)
}

console.log(`规格需求 ${ids.size} 条，测试引用 ${sourceFiles.length} 个文件`)

if (missing.length) {
  const message = `未追溯到测试的需求 ID：${missing.join(', ')}`
  if (strict) {
    console.error(message)
    process.exit(1)
  }
  console.warn(`${message}（开发期警告，收口时用 --strict）`)
}
