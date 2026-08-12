# MultiPort-Proxy

[English](README.md) · [PortPilot Chrome 扩展](https://github.com/huades/PortPilot)

MultiPort-Proxy 在浏览器本地把 Clash/Mihomo YAML 或节点分享链接转换为“一节点一端口”的 Mihomo 配置，并生成 PortPilot 可导入的本地代理档案。网页不会上传节点信息。

## 使用方法

### 1. 输入节点

选择一种输入方式：

- **Clash YAML：** 粘贴或上传包含 `proxies:` 节点数组的完整配置。
- **节点分享链接：** 每行输入一个 `vless://`、`vmess://`、`trojan://`、`ss://`、`socks://` 或 `http(s)://` 链接。

本项目不抓取远程订阅 URL。请粘贴订阅文件内容或从 v2rayN 复制出的节点分享链接。

### 2. 检查端口映射

1. 点击 **解析节点**。
2. 勾选需要使用的节点。
3. 设置起始端口和监听地址。默认值为 `8000`、`127.0.0.1`。
4. 默认 listener 为 **SOCKS5**；也可选择 HTTP 或 mixed。
5. 确认每个节点对应一个不同的本机端口。

### 3. 导出 Mihomo YAML

预览并下载 `mihomo.yaml`，然后运行：

```powershell
mihomo.exe -f .\mihomo.yaml
```

该文件是当前节点格式的配置快照。请保留原始 YAML 或分享链接；Mihomo 或节点格式变化后，应使用原始内容重新生成。

### 4. 导出 PortPilot JSON

1. 下载 `browser-profiles.json`。
2. 在 Chrome 开发者模式加载 [PortPilot](https://github.com/huades/PortPilot)。
3. 在 PortPilot 中导入 JSON 并选择代理档案。
4. 不再使用代理时选择 **直连**。

JSON 只包含 `127.0.0.1` 本地端口档案，不包含上游节点 UUID、密码或服务器地址。Mihomo 端口变化后需要重新导出并导入。

网页也支持复制单个文件、分别下载或下载同时包含 YAML 与 JSON 的 ZIP。顶部按钮可切换明亮/深色主题和中英文。

## 部署到 Cloudflare Pages

### Fork 后关联部署

1. 在 GitHub 点击 **Fork**，复制本项目。
2. 进入 Cloudflare：**Workers & Pages → Create application → Pages → Connect to Git**。
3. 选择自己的 Fork 和 `main` 分支。
4. 使用以下设置：

| 设置 | 值 |
|---|---|
| Root directory | `/` |
| Build command | 留空，或填写 `npm run build` |
| Build output directory | `apps/web/dist/pages` |

仓库已提交可直接部署的静态文件，因此 Build command 留空也可以部署。填写 `npm run build` 后，Cloudflare 会在每次部署时重新生成静态文件。

随机生成的 Pages 项目名可以直接使用，不需要改成仓库名，也不需要环境变量。

### 部署后显示 404

确认：

- Fork 已同步到上游最新提交。
- Build output directory 完全等于 `apps/web/dist/pages`。
- 没有填写 `apps/web/dist/client`。
- 使用的是 Pages 项目，而不是 Worker 项目。
- 修改设置后重新部署最新提交，而不是只刷新旧版本。

如果构建日志显示 **No build command specified**，在最新版中属于正常情况：Cloudflare 会直接发布仓库中已经提交的静态文件。
