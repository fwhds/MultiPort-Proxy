# MultiPort-Proxy 多端口代理转换器

[English](README.md) · [PortPilot Chrome 扩展](https://github.com/huades/PortPilot)

MultiPort-Proxy 是一个纯浏览器本地运行的中英文转换工具。它将 Clash/Mihomo YAML 或常见分享链接转换为“一节点一端口”的 Mihomo 配置，同时生成可导入 PortPilot 的 HTTP/SOCKS5 本地代理档案。

网页不会上传节点、抓取远程订阅、要求账号，也不会启动或控制 Mihomo/v2rayN。

## 功能

- 解析 Clash/Mihomo YAML。
- 解析 `vless://`、`vmess://`、`trojan://`、`ss://`、`socks://`、`http://`、`https://` 多行链接。
- 为每个节点生成独立的 `mixed`、`http` 或 `socks` listener。
- `mixed` listener 同时导出 HTTP 与 SOCKS5 PortPilot 档案。
- 保留原配置的 DNS、代理组和规则，支持 `dialer-proxy` 链式代理。
- 支持节点选择、手工 YAML 节点、稳定 ID 与稳定端口映射。
- 支持中英文切换、可读 YAML/JSON 预览、复制、单独下载和 ZIP 下载。

## 本地运行

需要 Node.js 22+ 和 npm 10+：

```powershell
git clone https://github.com/huades/MultiPort-Proxy.git
cd MultiPort-Proxy
npm install
npm run dev
```

常用检查：

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## 使用教程

1. 从 v2rayN 复制分享链接，或准备本地 Clash/Mihomo YAML。
2. 在网页选择 **Clash YAML** 或 **分享链接**，粘贴/上传内容并点击 **解析节点**。
3. 选择节点，设置起始端口、监听地址和 listener 类型。推荐使用 `42000`、`127.0.0.1`、`mixed`。
4. 在网页中检查完整的 `mihomo.yaml` 和 `browser-profiles.json` 预览。
5. 下载文件或 ZIP。
6. 启动 Mihomo：

```powershell
mihomo.exe -f .\mihomo.yaml
```

7. 在 PortPilot 中导入 `browser-profiles.json`，选择 HTTP 或 SOCKS5 档案。

PortPilot 只连接 Mihomo 创建的本机 HTTP/SOCKS 端口，不会直接连接 VLESS、VMess 或 Trojan 节点。

## 部署到 Cloudflare Pages

`npm run build` 会在 `apps/web/dist/pages` 生成真正的静态 Pages 站点，其中包含 `index.html` 和 `404.html`。根目录 `wrangler.jsonc` 已声明该输出目录。

### Fork 并关联 Cloudflare

1. 在 GitHub 点击 **Fork**，复制项目到自己的账号。
2. 打开 Cloudflare：**Workers & Pages → Create application → Pages → Connect to Git**。
3. 选择自己的 Fork。
4. 使用以下配置：

| 设置 | 值 |
|---|---|
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Build output directory | `apps/web/dist/pages` |

不需要环境变量。不要填写 `apps/web/dist/client`，该目录没有预渲染的 `index.html`，部署后会显示 404。

### Wrangler 手工部署

```powershell
npm install
npm run build
npx wrangler login
npm run deploy
```

部署成功后会获得 `*.pages.dev` 地址。自定义域名在 Pages 项目的 **Custom domains** 中设置。

### 404 排查

- 确认使用的是 Cloudflare **Pages** 项目。
- Build output directory 必须是 `apps/web/dist/pages`。
- 确认构建日志中出现 `Cloudflare Pages output`。
- 清除 Pages 构建缓存，再部署最新的 `main` 提交。
- 如果曾填写 `apps/web/dist/client`，修改后重新部署，不能只刷新旧版本。

## 项目结构

```text
MultiPort-Proxy/
├── .github/workflows/ # CI：类型、规范、测试和 Pages 构建检查
├── apps/web/          # React/Vinext 转换网页
├── packages/core/     # 解析、稳定 ID、端口映射和导出逻辑
├── scripts/           # Linux binding 与 Pages 预渲染脚本
└── wrangler.jsonc     # Cloudflare Pages 输出配置
```

Chrome 扩展源码由独立的 [huades/PortPilot](https://github.com/huades/PortPilot) 仓库管理。

## 隐私与限制

- `mihomo.yaml` 含上游节点凭据，应按敏感文件保存。
- `browser-profiles.json` 只含本地端口档案。
- 首版不抓取远程订阅、不提供账号系统、不自动控制 Mihomo/v2rayN。
- 服务商自定义字段可能需要手工调整。
