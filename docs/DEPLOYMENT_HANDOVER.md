# 部署交接清单

本文供新维护负责人 Yumi（GitHub：`yumi-526`）在仓库转移完成后执行。仓库转移会保留代码、Issue、PR、Release 与多数 GitHub 设置，但外部服务的授权、仓库路径和密钥必须逐项复核。

## 1. 接受仓库并检查权限

- 接受 GitHub 发出的仓库转移邀请。
- 确认默认分支为 `main`，Issues 与 Actions 已启用。
- 检查团队成员的 Collaborator 权限，并按需要保留或调整。
- 确认 `main` 的规则要求至少一次 PR 审批，并允许 GitHub Pages 工作流写入 Pages。

## 2. GitHub Pages 文档站

- 打开 **Settings → Pages**，Source 选择 **GitHub Actions**。
- 在 **Actions** 中手动运行 `Deploy GitHub Pages`，或向 `course/`、`docs/`、`static-site/` 提交一次变更。
- 确认部署成功，并把仓库 Homepage 更新为新地址：`https://yumi-526.github.io/avalon-companion/`。
- 若旧地址发生跳转或失效，更新 README、GitBook 和团队共享链接。

## 3. Vercel 产品站

- 在 Yumi 的 Vercel 账号或团队中导入转移后的 GitHub 仓库。
- Framework Preset 使用 Next.js，Production Branch 使用 `main`。
- 部署后验证首页、新建对局、完整任务流程、复盘和 `/api/feedback`。
- 将正式产品 URL 写入 GitHub 仓库 Homepage 或 README；不要把密钥写进仓库。

## 4. 反馈接口

在 Vercel 中配置以下环境变量：

```text
FEEDBACK_GITHUB_TOKEN=<fine-grained token>
FEEDBACK_GITHUB_REPOSITORY=yumi-526/avalon-companion
FEEDBACK_GITHUB_BRANCH=main
```

Token 只授予目标仓库所需的 **Issues: Read and write** 与 **Contents: Read and write**。完成一次带截图的测试反馈，确认 Issue 和 `feedback-attachments/` 均能创建，然后删除测试数据。

## 5. GitBook 与外部集成

- 将 GitBook 的 GitHub Sync 重新连接到转移后的仓库，并确认默认分支和根目录配置。
- 检查 GitBook PR status check 是否仍能正常回写。
- 复核所有 GitHub App、Deploy Key、Webhook、Actions secret 和 Vercel/GitBook 授权；移除不再需要的旧负责人凭据。

## 6. 验收

```bash
npm ci
npm run lint
npm run build
```

完成后在部署交接 Issue 中记录：GitHub Pages URL、产品 URL、验证日期、反馈接口状态和仍需处理的事项，并关闭该 Issue。
