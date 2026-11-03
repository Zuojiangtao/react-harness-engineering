# 迭代日志

记录真实的返工与拦截，而不是"AI 一次写完了所有代码"。每条都对应一次提交或一次门禁失败。

## 2026-11-03 21:00 TypeScript 7 与 typescript-eslint 不兼容

- 任务：搭工程底座，`npm install` 拿到 TypeScript 7.0.2。
- 现象：`eslint .` 直接抛 `typescript-eslint does not support TS 7.0`，连配置都加载不了。
- 处理：把 TypeScript 固定到 6.0.3；在 AGENTS.md 的已知陷阱里写明升级前先跑 lint。
- 结论：**版本也是 harness 的一部分**，不是装到最新就对了。

## 2026-11-03 21:20 AntD 6 的废弃 API 由测试警告暴露

- 任务：ResourceForm 的表单级错误提示。
- 现象：测试通过，但 stderr 出现 `[antd: Alert] message is deprecated. Please use title`。
- 处理：改用 `title`，并把"AntD 6 细节先查文档"写进 AGENTS.md。
- 结论：测试不仅断言结果，也负责暴露运行时警告。

## 2026-11-03 21:25 表单空值导致校验文案对不上

- 任务：ResourceForm 的空表单应该显示 Zod 的"客户名称至少 2 个字"。
- 现象：antd 未填写的文本框给的是 `undefined`，Zod 报的是"expected string"，自定义文案根本没命中。
- 处理：提交前把文本类字段的 `undefined` 归一化为 `''`，让 `.min()` 的文案生效。
- 拦截者：ResourceForm 组件测试。
- 结论：**校验文案也是契约**，要在组件层统一输入形状。

## 2026-11-03 21:30 列表默认排序把测试写错了

- 任务：断言客户列表第一页。
- 现象：测试等"远山科技"，页面一直不出现。
- 原因：默认排序是 `-createdAt`，种子数据里"远山科技"是最老的客户，根本不在第一页。实现是对的，测试的假设错了。
- 处理：改用第一页真实存在的"原点设计"；没有为了让测试通过去改排序。
- 结论：测试失败先判断"实现错还是假设错"，这次是假设错。

## 2026-11-03 21:40 react-hooks 规则拦住 URL → 输入框的同步

- 任务：搜索框回显 URL 里的 keyword。
- 现象：`useEffect(() => setKeyword(...))` 被 `react-hooks` 的 `set-state-in-effect` 规则判为错误。
- 处理：改成 `key + defaultValue` 的非受控输入，URL 变化时自然重挂载，去掉 effect 与一份本地状态。
- 结论：规则逼出了更简单的实现，而不是"加一行 disable"。

## 2026-11-03 21:50 第二个模块出现后才抽 useResourceList

- 任务：订单列表也要查询、翻页占位、三态推导。
- 处理：先把订单的 hook 直写一遍，确认两处差异只有 queryKey 与 list 函数，再抽 `shared/lib/use-resource-list.ts`，并回头改客户模块。
- 证据：提交 `refactor(shared): extract useResourceList after second module`。
- 结论：**抽象要有第二个调用点**，否则接口是猜的。

## 环境备注（不进入代码）

- 本机 pnpm 创建的 junction 在沙箱里无法被 Node 解析，改用 npm；`package-lock.json` 已提交。
- 本机 Vite 的 Windows 网络盘探测会触发沙箱限制，开发时用了一个不提交的本地 shim；正常机器直接 `npm run dev` 即可。
