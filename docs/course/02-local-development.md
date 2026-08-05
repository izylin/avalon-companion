# 2. 在本地跑起来

## 为什么部署前要本地验证

本地验证把问题范围缩小到代码和依赖。如果项目在你的电脑上都无法完成生产构建，上传到 Vercel 后通常也会失败。

## 下载自己的 Fork

在终端执行，记得替换用户名：

```bash
git clone https://github.com/你的用户名/avalon-notepad.git
cd avalon-notepad
```

`git clone` 会把 GitHub 中的仓库复制到电脑；`cd` 会进入项目目录。

## 安装并运行

```bash
npm install
npm run build
npm run dev
```

- `npm install`：安装项目声明的依赖
- `npm run build`：模拟生产环境构建
- `npm run dev`：启动本地开发服务器

浏览器打开 `http://localhost:3000`，确认能看到阿瓦隆笔记本首页。

## 检查点

- `npm run build` 最终没有出现错误
- 本地首页可以打开
- 可以进入新开一局页面

> **场景题：** 本地页面打不开时，应该先去 Vercel 找问题吗？不应该。此时部署尚未发生，应先检查终端中的本地报错。

[下一章：首次部署到 Vercel →](03-first-deployment.md)
