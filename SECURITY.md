# Security Policy

## System and Scope

天依档案是公开的 React 静态站点，部署在 GitHub Pages。安全范围包括站点源码、GitHub Pages 发布流程、Issues、Discussions、投稿数据同步脚本、GitHub Actions、依赖包和仓库权限配置。

仓库中的 Issues、Discussion 内容、图片附件 URL、PR 内容和依赖元数据均视为不可信输入。GitHub Actions 的 Token、Pages 部署权限、作品快照和作者数据是需要保护的资产。

## Threat Model and Trust Boundaries

- 任何互联网用户都可以提交 Issue 或 Discussion 内容；维护者审核后才允许内容进入 `main`。
- GitHub Actions 是受信任的自动化边界，但只能使用完成任务所需的最小权限。
- GitHub Pages 只发布经过构建检查并合入 `main` 的静态产物。
- Discussions 是投稿作品的权威来源；生成的 JSON 是可审计的站点读快照，不是独立写入源。
- 第三方 Actions、npm 依赖和 GitHub API 响应属于供应链或外部边界，必须经过版本固定和失败校验。

## Security Invariants

- 不可信内容不得进入 shell 命令、动态脚本、Actions 表达式或未经校验的 API mutation。
- 作品图片只接受 HTTPS GitHub user attachment URL；原作链接只接受 HTTPS。
- Discussion 同步只操作固定的 `作品档案` 分类和合法的版本化数据区块。
- 归一化使用稳定强键，低置信度相似项不得被自动合并或删除。
- 快照只有在完整同步成功后才写入；部分失败不得覆盖现有快照。
- 生产内容通过受保护的 PR 进入 `main`，Actions 不得绕过必需检查或审阅。
- 工作流使用最小权限、固定 SHA 的第三方 Actions，并且不得把 Token 写入日志或评论。

## Reportable Findings and Severity Context

以下问题属于安全漏洞：工作流注入或任意代码执行、Token 越权、未经审阅的仓库写入、供应链投毒、敏感信息泄露、恶意 URL/XSS、作品快照完整性破坏，以及能够影响公开站点内容或部署的权限绕过。

严重性按可达性、所需权限和影响评估：公开输入可触发的代码执行或仓库写入为高严重性；可造成公开数据篡改、Token 泄露或部署绕过的为中高严重性；仅限维护者误操作且无权限提升的完整性问题为中低严重性。

请通过 GitHub 的私密漏洞报告或 Security Advisories 报告问题，不要在公开 Issue 中发布利用细节。

## Out of Scope and Accepted Risk

GitHub 平台自身的可用性、作品版权事实判断、种子作品内容质量和纯视觉问题不属于本仓库安全漏洞。公开站点不提供用户登录、私有作品或多租户隔离，因此不承诺这些能力。

## Known Limitations and Compensating Controls

GitHub Pages、Issues、Discussions 和 GitHub API 的可用性由 GitHub 提供；同步任务失败时保留上一次有效快照，并通过 Actions 状态暴露失败。作者归一化只使用强键，不对相似姓名进行模糊自动合并；需要维护者通过 Discussion 或 PR 修正。
