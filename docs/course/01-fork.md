# 1. Fork：创建自己的仓库

## 为什么先 Fork

Fork 是在自己的 GitHub 账号下创建一份项目副本。副本保留原项目的代码和历史，但之后的修改、权限和部署都由你自己管理，不会影响原仓库。

对于个人 GitHub 仓库，Vercel 通常要求导入者是仓库所有者。使用自己的 Fork，能让你完整体验授权和自动部署流程。

## 动手操作

1. 登录 GitHub，打开原项目仓库。
2. 点击右上角 **Fork**。
3. 保持默认仓库名称 `avalon-notepad`，点击 **Create fork**。
4. 等待 GitHub 创建完成。

## 检查点

观察浏览器地址：

```text
https://github.com/你的用户名/avalon-notepad
```

如果仓库所有者是你的用户名，这一步就完成了。

> **想一想：** 为什么不让所有学习者共同部署同一个仓库？因为共享仓库会共享权限、提交和部署状态，一个人的操作可能影响所有人。Fork 为每个人提供了独立练习场。

参考：[GitHub 官方 Fork 指南](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo)

[下一章：在本地跑起来 →](02-local-development.md)
