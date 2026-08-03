# Security Policy

## System and Scope

天依档案是自托管的 React Router SSR 应用，使用 SQLite 存储作品元数据，并将用户上传的图片保存在服务器磁盘。安全范围包括应用源码、生产 Node 服务器、SQLite 与上传目录、GitHub Actions、依赖包和仓库权限配置。

用户通过投稿表单提交的文本字段与图片文件均视为不可信输入。服务器上的数据库文件、上传目录、运行环境密钥和工作流 Token 是需要保护的资产。

## Threat Model and Trust Boundaries

- 任何可访问站点的用户都可以投稿；成功提交后作品会立即写入数据库并对外可见（无审核队列）。
- 生产 Node 进程是受信任边界：负责校验表单、限制图片类型与大小、安全写入上传目录，以及 SSR 与静态资源服务。
- GitHub Actions 只负责 CI/CodeQL，不得部署或写入生产数据。
- 第三方 Actions 与 npm 依赖属于供应链边界，必须经过版本固定与失败校验。

## Security Invariants

- 不可信内容不得进入 shell 命令、动态脚本或未经校验的系统调用。
- 原作链接只接受 HTTPS；图片仅接受常见图像扩展名，并限制文件大小（默认 10MB）。
- `/uploads/` 静态路径必须经过 `resolve` + 前缀校验，防止目录穿越。
- 生产内容通过受保护的 PR 进入 `main`；CI 不得绕过必需检查。
- 工作流使用最小权限、固定 SHA 的第三方 Actions，并且不得把 Token 写入日志。

## Reportable Findings and Severity Context

以下问题属于安全漏洞：任意文件写入/读取、路径穿越、命令注入、供应链投毒、敏感信息泄露、XSS、未授权修改或删除档案数据，以及能够影响公开站点内容的权限绕过。

严重性按可达性、所需权限和影响评估：公开输入可触发的远程代码执行或任意文件读写为高严重性；可造成公开数据篡改或依赖投毒的为中高严重性；仅限运维误配置且无权限提升的为中低严重性。

请通过 GitHub 的私密漏洞报告或 Security Advisories 报告问题，不要在公开 Issue 中发布利用细节。

## Out of Scope and Accepted Risk

作品版权事实判断、种子作品内容质量和纯视觉问题不属于本仓库安全漏洞。当前版本不提供用户登录、私有作品或多租户隔离，因此不承诺这些能力。部署方需自行保护 VPS/Docker 主机、数据库与上传卷的访问控制与备份。

## Known Limitations and Compensating Controls

SQLite 与上传目录的可用性由部署方保障；请为 `data/` 与 `uploads/` 配置持久化卷和备份。投稿即发布，运营侧如需审核应在入口（例如反向代理鉴权或关闭公开 `/upload`）自行加控。
