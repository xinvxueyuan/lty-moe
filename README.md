# 天依档案 / lty-moe

一个围绕洛天依的非官方同人作品档案室。

## 投稿流程

1. 在 GitHub Issues 中选择「洛天依同人作品投稿」。
2. 按表单填写作品信息，并把图片拖拽到作品图片字段。
3. 许可证、维护者、共同作者、AI 使用声明和原创/转载来源会和作品一起进入档案。
4. 提交后，带有 `submission:work` 标签的 Issue 会由 GitHub Actions 自动整理为 PR。
5. PR 通过构建检查并获得维护者批准后合并。
6. 合并后自动删除投稿分支，并由 GitHub Pages 发布最新站点。

## Discussions 数据库

投稿作品的权威记录存储在 GitHub Discussions 的「作品档案」分类中，每个作品对应一个 Discussion。请在仓库 Settings 中启用 Discussions，并创建名为「作品档案」的分类；归一化 Action 会拒绝写入不存在的分类。

每日 `Normalize Discussions database` Action 会读取 Discussions，按照来源 Issue、规范化原作链接，或规范化作者 ID 加精确标题合并高置信度重复项，并生成 `src/data/submissions.json` 与 `src/data/authors.json` 快照。快照只由 Action 生成，不应手工编辑；无法通过强键确认的相似条目会保留给维护者处理。

首次启用时可从现有投稿快照运行一次 `workflow_dispatch` 完成迁移。Action 使用 `GITHUB_TOKEN` 的 `contents: write`、`discussions: write` 和 `pull-requests: write` 权限；若仓库策略禁止该 Token 修改 Discussions，需要改用具有相同仓库权限的 `DISCUSSIONS_TOKEN` Secret。

如果需要修改已经发布的 Issue 投稿，请选择「更新天依档案条目」，填写作品详情页中的 `issue-*` 作品 ID。更新会生成独立 PR，种子作品不接受通过 Issue 直接修改。

Pages 的实际地址由 GitHub Pages deployment output 动态返回，工作流不会硬编码域名。

## 本地开发

```bash
npm ci
npm run dev
```

## 构建与测试

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:submission
npm run build
npm run playwright:install
npm run test:e2e
```

应用使用 React Router Framework Mode 的静态预渲染（`ssr: false`），生产静态文件位于 `build/client`。GitHub Pages 的路径由 `VITE_BASE_PATH` 注入，例如：

```bash
VITE_BASE_PATH=/lty-moe/ npm run build
```

## Security

安全边界、威胁模型、报告渠道和已知限制见 [SECURITY.md](./SECURITY.md)。仓库启用了 Dependabot、secret scanning push protection 和 CodeQL；工作流使用最小权限，第三方 Action 固定到 commit SHA。

## 许可

代码使用 MIT License。投稿者需要确认其提交内容拥有发布权或已获得授权；作品本身的著作权仍归原作者所有。
