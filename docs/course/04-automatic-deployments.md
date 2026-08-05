# 4. 理解自动部署

连接 GitHub 后，Vercel 会监听仓库的新提交。你不需要每次重新上传整个项目。

## Preview 和 Production

| 环境 | 什么时候产生 | 用途 |
| --- | --- | --- |
| Preview | 推送非生产分支或创建 Pull Request | 在合并前检查改动 |
| Production | 推送或合并到生产分支，通常是 `main` | 提供正式访问地址 |

## 动手实验

```bash
git switch -c practice/change-title
```

1. 修改一处容易观察的页面文字。
2. 保存后运行 `npm run build`。
3. 提交并推送：

```bash
git add .
git commit -m "练习：修改页面文字"
git push -u origin practice/change-title
```

4. 在 GitHub 创建 Pull Request。
5. 查看 Vercel 生成的 Preview Deployment。
6. 检查无误后合并到 `main`。
7. 查看 Production Deployment 是否更新。

## 检查点

你应该能看到两个不同目的的部署：Preview 用于试验，Production 用于正式发布。

> **想一想：** 为什么不直接在 `main` 修改？分支和 Preview 提供了上线前的检查机会，错误不会立刻替换正式版本。

参考：[Vercel 官方部署环境说明](https://vercel.com/docs/deployments/environments)

[下一章：配置反馈功能 →](05-feedback.md)
