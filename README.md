# 天依档案 / lty-moe

一个围绕洛天依的非官方同人作品档案室。自托管动态应用：React Router SSR + SQLite + 本地图片上传。

## 投稿流程

1. 打开站点上的「投稿」页面（`/upload`）。
2. 填写作品信息并上传图片（PNG / JPG / WebP / GIF / AVIF，最大 10MB）。
3. 提交后作品会**立即发布**到展厅，无需审核队列。
4. 许可证、维护者、共同作者、AI 使用声明和原创/转载来源会与作品一并写入档案。

## 渲染模式（混合架构）

全局启用 React Router SSR（`ssr: true`），按路由差分数据加载：

| 路由                                  | 模式             | 说明                                                                 |
| ------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| `/`、`/works/:id`、`/creator/:handle` | SSR + 客户端缓存 | 首屏 server `loader`；客户端再导航优先走内存缓存 / API               |
| `/explore`、`/following`              | SPA 数据层       | `clientLoader` → `/api/works`（60s 内存缓存）+ 骨架屏                |
| `/upload`                             | SSR 壳 + action  | 提交成功后 `clientAction` 清空 works 缓存                            |
| `/api/works`、`/api/works/:id`        | Resource API     | 作品 JSON                                                            |
| `POST /api/images`                    | 图床 API         | `multipart/form-data` 字段 `image`（或 `file`），返回 `/uploads/...` |

### 图床 API 示例

```bash
curl -X POST http://127.0.0.1:3000/api/images \
  -F "image=@./art.png"
# → {"url":"/uploads/img-….png","filename":"img-….png","size":…,"contentType":"image/png"}
```

## 账号与后台

| 区域                  | 路径                                               | 说明                           |
| --------------------- | -------------------------------------------------- | ------------------------------ |
| 登录 / 注册           | `/login` `/register`                               | 创作者账号；会话 Cookie + CSRF |
| 用户中心              | `/account`                                         | 资料编辑                       |
| 创作者仪表盘          | `/dashboard`                                       | 草稿 / 已发布列表              |
| 在线编辑器 / 发布后台 | `/dashboard/works/new` `/dashboard/works/:id/edit` | 正文、状态、发布               |
| 管理后台              | `/admin`                                           | 用户角色、作品状态（需 admin） |

首次空库会创建管理员：`admin@lty.local` / `admin123456`（可用环境变量 `ADMIN_EMAIL` `ADMIN_PASSWORD` 覆盖）。图床 `POST /api/images` 需登录。

### 环境变量（可选）

| 变量                                        | 用途                                        |
| ------------------------------------------- | ------------------------------------------- |
| `APP_URL`                                   | 站点绝对 URL（OAuth / 邮件链接）            |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth                                |
| `MAIL_WEBHOOK_URL` / `MAIL_WEBHOOK_TOKEN`   | 邮件发送 webhook；未配置时写入 `logs/mail/` |
| `LOG_DIR`                                   | 应用日志目录（默认 `logs/`）                |

多设备会话：同一账号可在多端同时登录（30 天滑动过期）；在 `/account` 可查看并注销设备。

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
