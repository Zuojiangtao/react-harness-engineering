#!/usr/bin/env node
/**
 * 一条命令跑完所有门禁，快速失败，逐步计时。
 * 可选步骤（spec / contract）在脚本存在时才执行，保证脚手架阶段也能绿。
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const isWindows = process.platform === 'win32'

function localBin(name) {
  const file = join(root, 'node_modules', '.bin', isWindows ? `${name}.cmd` : name)
  return existsSync(file) ? file : name
}

/** @type {[string, string[]][]} */
const steps = [
  ['format', ['prettier', '--check', '.']],
  ['lint', ['eslint', '.', '--max-warnings=0']],
  ['boundaries', ['node', 'scripts/check-boundaries.mjs']],
  ['typecheck', ['tsc', '--noEmit', '-p', 'tsconfig.app.json']],
  ['typecheck:node', ['tsc', '--noEmit', '-p', 'tsconfig.node.json']],
  ['test', ['vitest', 'run']],
]

if (existsSync(join(root, 'scripts', 'check-spec.mjs'))) {
  steps.push(['spec', ['node', 'scripts/check-spec.mjs', '--strict']])
}
steps.push(['build', ['vite', 'build']])

const started = Date.now()
const failed = []

for (const [name, [cmd, ...args]] of steps) {
  const t = Date.now()
  const isNode = cmd === 'node'
  const result = spawnSync(isNode ? process.execPath : localBin(cmd), args, {
    cwd: root,
    stdio: 'inherit',
    shell: isNode ? false : isWindows,
    env: process.env,
  })
  const cost = Date.now() - t
  if (result.status === 0) {
    console.log(`\n\u001b[32mPASS\u001b[0m ${name} (${cost}ms)`)
  } else {
    console.log(`\n\u001b[31mFAIL\u001b[0m ${name} (${cost}ms)`)
    failed.push(name)
    break // 快速失败：先修第一个
  }
}

const total = Date.now() - started
if (failed.length) {
  console.error(`\nverify FAILED at "${failed[0]}" after ${total}ms`)
  process.exit(1)
}
console.log(`\nverify OK in ${total}ms`)
