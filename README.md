# 天依档案 / lty-moe

一个围绕洛天依的非官方同人作品档案室。自托管动态应用：React Router SSR + SQLite + 本地图片上传。

## 投稿流程

1. 打开站点上的「投稿」页面（`/upload`）。
2. 填写作品信息并上传图片（PNG / JPG / WebP / GIF / AVIF，最大 10MB）。
3. 提交后作品会**立即发布**到展厅，无需审核队列。
4. 许可证、维护者、共同作者、AI 使用声明和原创/转载来源会与作品一并写入档案。

## 本地开发

```bash
npm ci
npm run dev
```

开发服务器会在首次访问时创建 SQLite 库（默认 `data/lty-moe.db`）并在表为空时写入示例作品。上传目录默认 `uploads/`。

## 构建与运行

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run build
npm run start
```

生产服务器读取 `build/` 产物，默认监听 `PORT`（3000），环境变量：

| 变量            | 默认                | 说明            |
| --------------- | ------------------- | --------------- |
| `DATABASE_PATH` | `./data/lty-moe.db` | SQLite 文件路径 |
| `UPLOADS_DIR`   | `./uploads`         | 上传图片目录    |
| `PORT`          | `3000`              | HTTP 端口       |

## Docker

```bash
docker build -t lty-moe .
docker run --rm -p 3000:3000 \
  -v lty-data:/app/data \
  -v lty-uploads:/app/uploads \
  lty-moe
```

请挂载 `data/` 与 `uploads/` 卷，否则容器重建会丢失数据库与上传文件。

## 端到端测试

```bash
npm run playwright:install
npm run test:e2e
```

## Security

安全边界、威胁模型、报告渠道和已知限制见 [SECURITY.md](./SECURITY.md)。仓库启用了 Dependabot、secret scanning push protection 和 CodeQL；工作流使用最小权限，第三方 Action 固定到 commit SHA。

## 许可

代码使用 MIT License。投稿者需要确认其提交内容拥有发布权或已获得授权；作品本身的著作权仍归原作者所有。
