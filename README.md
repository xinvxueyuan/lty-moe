# 天依档案 / lty-moe

一个围绕洛天依的非官方同人作品档案室。

## 投稿流程

1. 在 GitHub Issues 中选择「洛天依同人作品投稿」。
2. 按表单填写作品信息，并把图片拖拽到作品图片字段。
3. 许可证、维护者、共同作者、AI 使用声明和原创/转载来源会和作品一起进入档案。
4. 提交后，带有 `submission:work` 标签的 Issue 会由 GitHub Actions 自动整理为 PR。
5. PR 通过构建检查并获得维护者批准后合并。
6. 合并后自动删除投稿分支，并由 GitHub Pages 发布最新站点。

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

## 许可

代码使用 MIT License。投稿者需要确认其提交内容拥有发布权或已获得授权；作品本身的著作权仍归原作者所有。
