# 6. 排查部署问题

遇到“打不开”时，不要马上重新部署。先判断问题发生在哪一层。

## 排查路线

```text
本地 build 是否成功？
  ├─ 否 → 代码、类型或依赖问题
  └─ 是
      ↓
Vercel build 是否成功？
  ├─ 否 → 查看第一条构建错误和项目设置
  └─ 是
      ↓
部署地址是否能建立连接？
  ├─ 否 → 域名、DNS 或网络问题
  └─ 是
      ↓
页面功能是否正常？
  ├─ 主体异常 → 浏览器控制台或运行时日志
  └─ 仅反馈异常 → 环境变量、Token 权限或仓库名
```

## 常见情况

### Vercel 中找不到仓库

确认导入的是自己的 Fork，并检查 Vercel GitHub App 是否获得该仓库的访问权限。

### 构建失败

先在本地运行：

```bash
npm install
npm run build
```

从终端或 Vercel 日志中的第一条错误开始排查，不要只看最后的失败总结。

### 构建成功但网页打不开

检查部署是否仍存在、域名是否正确，以及当前网络能否访问 `vercel.app`。中国大陆网络环境下尤其需要排除 DNS 或连接阻断。

### 网页能打开但反馈失败

检查三个 `FEEDBACK_GITHUB_*` 环境变量、Token 权限和仓库名。变量修改后必须重新部署。

### 推送代码却没有自动部署

进入 Vercel 项目的 **Settings → Git**，确认：

- Connected Git Repository 是自己的 Fork
- Production Branch 是 `main`
- GitHub App 仍有仓库权限

## 毕业验收

- [ ] 自己的 GitHub 账号下有项目 Fork
- [ ] 本地 `npm run build` 成功
- [ ] Vercel Production 地址可以访问
- [ ] Pull Request 能生成 Preview
- [ ] 合并到 `main` 能更新 Production
- [ ] 能判断构建问题、运行时问题和网络问题的区别

完成这些项目，就已经独立走通了一次真实的 Web 应用部署流程。
