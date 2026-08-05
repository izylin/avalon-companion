# 3. 首次部署到 Vercel

## 三个平台如何分工

```text
GitHub：保存代码
Vercel：读取代码、安装依赖、执行构建、托管网站
浏览器：访问 Vercel 提供的网址
```

基础游戏功能不需要数据库，也不需要环境变量。对局数据保存在访问者自己的浏览器 `localStorage` 中，因此第一次部署可以保持简单。

## 导入项目

1. 使用 GitHub 账号登录 [Vercel](https://vercel.com/)。
2. 在 Dashboard 点击 **Add New → Project**。
3. 找到自己 Fork 的 `avalon-notepad`，点击 **Import**。
4. 如果仓库没有出现，检查 Vercel GitHub App 是否获得该 Fork 的访问权限。

## 构建设置

保持以下配置：

| 配置 | 值 |
| --- | --- |
| Framework Preset | `Next.js` |
| Root Directory | `.` |
| Build Command | 默认的 `next build` |
| Output Directory | 留空 |
| Environment Variables | 第一次部署先留空 |

点击 **Deploy**，等待构建完成。

## 检查点

- Vercel Deployment 状态显示成功
- 获得一个 `*.vercel.app` 地址
- 地址能打开首页并正常开始一局游戏

> **注意：** 中国大陆网络可能无法稳定访问 `vercel.app`。如果构建显示成功但网页打不开，应先换一个可访问 Vercel 的网络验证，不要马上认定代码出错。

参考：[Vercel 官方 Git 仓库部署指南](https://vercel.com/docs/git)

[下一章：理解自动部署 →](04-automatic-deployments.md)
