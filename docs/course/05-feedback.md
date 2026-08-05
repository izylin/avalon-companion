# 5. 可选：配置反馈功能

本章用于练习服务端环境变量和 GitHub API。跳过它不会影响游戏主体，只会使右下角的反馈提交功能不可用。

## 先理解三个变量

```text
FEEDBACK_GITHUB_TOKEN=代表应用操作 GitHub 的秘密凭证
FEEDBACK_GITHUB_REPOSITORY=反馈要写入哪个仓库
FEEDBACK_GITHUB_BRANCH=截图附件写入哪个分支
```

Token 只能保存在 Vercel 环境变量中，不能提交到 GitHub，也不能使用 `NEXT_PUBLIC_` 前缀暴露给浏览器。

## 配置步骤

1. 在自己的 GitHub Fork 创建 fine-grained personal access token。
2. 将仓库范围限制为自己的 `avalon-notepad` Fork。
3. 授予 **Issues: Read and write** 和 **Contents: Read and write**。
4. 打开 Vercel 项目的 **Settings → Environment Variables**。
5. 添加：

```text
FEEDBACK_GITHUB_TOKEN=你的令牌
FEEDBACK_GITHUB_REPOSITORY=你的用户名/avalon-notepad
FEEDBACK_GITHUB_BRANCH=main
```

6. 至少应用到 Production；需要在预览地址测试时也应用到 Preview。
7. 保存并重新部署。环境变量不会自动应用到已经完成的旧部署。

## 检查点

在线上页面提交一条测试反馈，确认自己的 Fork 中出现：

- 一个新的 GitHub Issue
- `feedback-attachments/` 目录下的截图附件

> **安全题：** 可以把 Token 写进 `.env.example` 方便同学复制吗？不可以。示例文件只能写变量名称或空值，不能包含真实秘密。

参考：[Vercel 官方环境变量说明](https://vercel.com/docs/environment-variables)

[下一章：排查部署问题 →](06-troubleshooting.md)
