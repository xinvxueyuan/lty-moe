# 天依档案 / lty-moe

一个围绕洛天依的非官方同人作品档案室。

## 投稿流程

1. 在 GitHub Issues 中选择「洛天依同人作品投稿」。
2. 按表单填写作品信息，并把图片拖拽到作品图片字段。
3. 提交后，带有 `submission:work` 标签的 Issue 会由 GitHub Actions 自动整理为 PR。
4. PR 通过构建检查并获得维护者批准后合并。
5. 合并后自动删除投稿分支，并由 GitHub Pages 发布最新站点。

Pages 的实际地址由 GitHub Pages deployment output 动态返回，工作流不会硬编码域名。

## 本地开发

```bash
npm ci
npm run dev
```

## 构建与测试

```bash
npm run test:submission
npm run build
```

## 许可

代码使用 MIT License。投稿者需要确认其提交内容拥有发布权或已获得授权；作品本身的著作权仍归原作者所有。
