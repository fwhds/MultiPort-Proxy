# MultiPort-Proxy 多端口代理转换器

[English](README.md) · [PortPilot Chrome 扩展](https://github.com/huades/PortPilot)

[![一键部署到 Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/huades/MultiPort-Proxy)

MultiPort-Proxy 是一个注重隐私的网页转换器，用来生成稳定的“一节点一端口”Mihomo 配置。粘贴 Clash/Mihomo YAML 或支持的分享链接，选择节点后即可导出可运行的 `mihomo.yaml`，以及供 PortPilot 导入且不含上游密钥的 `browser-profiles.json`。

所有解析和生成操作都在浏览器本地完成。网页不会上传代理凭据、抓取远程订阅，不需要账号，也不会启动或控制 Mihomo/v2rayN 进程。

## 工作方式

```text
Clash YAML / 分享链接
          │
          ▼
 MultiPort-Proxy（浏览器本地解析）
          │
          ├── mihomo.yaml ─────────────► Mihomo ─► 127.0.0.1:42000、42001……
          │
          └── browser-profiles.json ───► PortPilot ─► Chrome 代理切换
```

相同节点与相同起始端口会得到稳定一致的档案 ID 和端口映射。

## 主要功能

- 解析 Clash/Mihomo YAML，以及多行 `vless://`、`vmess://`、`trojan://`、`ss://`、`socks://`、`http://`、`https://` 分享链接。
- 为每个选中节点生成独立的 Mihomo `mixed`、`http` 或 `socks` listener；`mixed` 会为 PortPilot 同时导出 HTTP 与 SOCKS5 档案，两者共用同一个本地端口。
- 保留输入配置中的 DNS、代理组、规则等顶层设置，并支持跳板 B → 出口 A 的 `dialer-proxy` 链式配置。
- 支持使用单节点 YAML 手工添加节点。
- 默认监听 `127.0.0.1`，起始端口 `42000`，listener 类型为 `mixed`。
- 可单独下载 YAML/JSON，也可一次下载 ZIP。
- 网页支持中英文切换。
- PortPilot JSON 不包含上游 UUID、密码或服务器凭据。

## 本地启动

环境要求：Node.js 22+、npm 10+；运行生成的配置还需要 Mihomo。只有需要在 Chrome 中快速切换代理时才需要 PortPilot。

```powershell
git clone https://github.com/huades/MultiPort-Proxy.git
cd MultiPort-Proxy
npm install
npm run dev
```

打开 Vite 输出的本地地址，通常为 `http://localhost:3000`。

常用命令：

```powershell
npm run typecheck      # TypeScript 类型检查
npm test               # 核心解析和导出测试
npm run build          # 构建生产版 Worker
npm run package:deploy # 在 release/ 下生成部署压缩包
```

## 使用教程

### 第一步：准备节点内容

可以使用：

- 本地 Clash/Mihomo YAML 文件；或
- 从 v2rayN 复制/导出的分享链接，每行一个。

在 v2rayN 中选中需要的服务器，再使用“复制所选服务器分享链接”一类命令复制到剪贴板；不同版本的菜单名称可能略有差异。不要粘贴远程订阅 URL，首版明确不抓取订阅地址。

### 第二步：解析并分配端口

1. 选择 **Clash YAML** 或 **分享链接**。
2. 粘贴内容，或上传本地 `.yaml`、`.yml`、`.txt` 文件，然后点击 **解析节点**。
3. 勾选要使用的节点。
4. 设置起始端口、监听地址和 listener 类型。推荐本机配置为 `42000`、`127.0.0.1`、`mixed`。
5. 检查每个选中节点是否获得了不同的本地端口。

选择 `mixed` 时，每个节点会在 `browser-profiles.json` 中出现两次：`[HTTP]` 和 `[SOCKS5]`。它们使用同一端口，这是 Mihomo mixed listener 的正常行为，可在 PortPilot 中按需要选择其中一个。

除非确实需要让局域网其他设备访问，否则不要把监听地址改出 `127.0.0.1`。对局域网开放可能形成无认证代理端口。

### 第三步：导出并启动 Mihomo

下载 `mihomo.yaml`，也可以直接下载完整 ZIP。进入配置文件所在目录后运行：

```powershell
mihomo.exe -f .\mihomo.yaml
```

使用期间需要保持 Mihomo 运行。如果程序立即退出，请查看控制台输出，常见原因包括节点参数不受支持、端口被占用或输入格式错误。

### 第四步：在 Chrome 中使用

1. 下载 `browser-profiles.json`。
2. 按 [PortPilot 仓库](https://github.com/huades/PortPilot)说明，通过 Chrome 开发者模式加载扩展。
3. 打开 PortPilot，导入 JSON 并选择一个代理档案。
4. 执行连通性或出口 IP 检测。
5. 不再使用代理时，在 PortPilot 中选择 **直连**，恢复 Chrome 正常网络设置。

PortPilot 只连接本机 HTTP/SOCKS 监听端口，不直接连接 VLESS、VMess 或 Trojan 节点；真正的节点连接由 Mihomo 完成。

## 部署到 Cloudflare Workers

本项目实际部署目标是 **Cloudflare Workers**，不是传统的 Pages 静态目录上传。Vinext 会在 `apps/web/dist/server/` 中生成 Worker 入口、静态资源绑定和部署配置。

仓库根目录包含固定的 `wrangler.jsonc`，Cloudflare 可以在构建前识别 Worker，因此一键部署不会再进入“自动项目配置”流程。该文件指向构建生成的 `apps/web/dist/server/index.js` 和 `apps/web/dist/client`。

### 一键部署

点击顶部 **Deploy to Cloudflare** 按钮，登录 Cloudflare 与 GitHub，确认自动生成的仓库名和 Worker 名称后部署。Cloudflare 会识别根目录的 `build` 与 `deploy` 命令，并在你的 Git 账号下创建一个新仓库；之后推送代码即可继续通过 Workers Builds 发布。

一键部署要求源仓库保持公开。部署包不包含任何代理节点或凭据，节点配置仍由使用者在自己的浏览器中本地输入。

### Cloudflare 控制台关联 GitHub（推荐）

本方案不需要 GitHub Actions，也不需要在 GitHub 保存 Cloudflare API Token。构建和部署全部由 Cloudflare Workers Builds 完成。

#### 1. 导入 GitHub 仓库

1. 登录 Cloudflare，进入 **Workers & Pages → Create application**。
2. 在 **Import a repository** 旁点击 **Get started**。
3. 连接 GitHub；首次使用时授权 **Cloudflare Workers and Pages** GitHub App。
4. 选择私有仓库 `huades/MultiPort-Proxy`。如果列表中没有该仓库，在 GitHub App 设置中为它增加访问权限。
5. Worker 名称填写 `multiport-web`。名称必须与构建生成的 Wrangler 配置一致。

已有 `multiport-web` Worker 时，不要重复创建：进入该 Worker 的 **Settings → Builds → Connect**，再关联同一仓库。

#### 2. 填写构建设置

| 设置 | 填写内容 |
|---|---|
| Production branch | `main` |
| Root directory | `/`（仓库根目录） |
| Build command | `npm run typecheck && npm test && npm run build` |
| Deploy command | `npm run deploy:cloudflare` |
| Non-production branch deploy command | `npm run preview:cloudflare` |

根目录必须保持为仓库根目录，因为 `apps/web` 依赖工作区中的 `packages/core`。不要把 Root directory 设置成 `apps/web`。

#### 3. 保存并手动部署

1. 点击 **Save and Deploy**，Cloudflare 会拉取 `main`、安装依赖、检查、测试、构建并部署。
2. 以后需要手动重建时，进入 **Workers & Pages → multiport-web → Builds**，选择最新提交并点击 **Retry build** 或 **Deploy**。
3. 当 `main` 有新提交时，关联项目默认也会自动构建；如只希望手动部署，可在 **Settings → Builds** 中关闭 Production branch 的自动构建，再按上一步手动触发。
4. 构建成功后使用 Cloudflare 提供的 `*.workers.dev` 地址访问。

#### 4. 可选构建范围

在 **Settings → Builds** 中配置 Build watch paths，可只监听：

```text
apps/web/**
packages/core/**
package.json
package-lock.json
```

README 单独修改时便不会触发网页重建。分支预览启用后，非 `main` 分支会使用 `preview:cloudflare` 上传预览版本，不会直接替换生产版本。

#### 5. 验证部署

打开部署地址，检查中英文切换、示例解析、节点端口、HTTP/SOCKS5 档案、YAML/JSON 预览和下载。部署记录位于 **Workers & Pages → multiport-web → Deployments**，构建日志位于 **Builds**。

### 本机命令行备用部署

```powershell
npm install
npm run build
npx wrangler login
npm run deploy:cloudflare
```

不要直接修改 `dist/server/wrangler.json`，每次构建都会重新生成。部署完成后，如需绑定自己的域名，可在 Cloudflare 中打开该 Worker，再通过 **Domains** 页面添加 Custom Domain。

### 绑定域名与回滚

- 自定义域名：进入 **Workers & Pages → multiport-web → Settings → Domains & Routes → Add → Custom Domain**。域名必须属于同一 Cloudflare 账号，并且不能存在冲突的 CNAME。
- 回滚：进入 **Workers & Pages → multiport-web → Deployments**，在目标历史版本右侧菜单中选择 **Rollback**。也可以在 `apps/web` 目录运行 `npx wrangler rollback`。
- `workers.dev` 适合首次验证；正式用途建议绑定 Custom Domain 或 Worker Route。

Cloudflare 官方资料：[Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)、[Git 仓库关联](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/)、[构建配置](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[自定义域名](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。

### 部署故障排查

- **GitHub 仓库不可见：** 在 GitHub 的 Cloudflare App 安装设置中允许访问 `huades/MultiPort-Proxy`。
- **Worker 名称不匹配：** Cloudflare 项目名称必须为 `multiport-web`。
- **找不到 Worker 入口：** 确认 Root directory 是 `/`，Build command 成功生成了 `apps/web/dist/server/index.js`。
- **缺少 Linux 原生 binding：** 不要跳过根目录的 `prebuild`；它会在 Linux 上自动安装匹配的 Rolldown 与 Lightning CSS binding。
- **Worker 可访问但自定义域名不可用：** 确认域名已在同一 Cloudflare 账号激活，且不存在冲突的 CNAME 记录。
- **新版本部署后异常：** 在 Cloudflare 的 Worker 部署历史中回滚到已知可用版本。
- **只想手动发布：** 在 Worker 的 **Settings → Builds** 中关闭生产分支自动构建，需要时从 Builds 页面手动触发。

## 项目结构

```text
MultiPort-Proxy/
├── apps/web/          # 转换网页和 Cloudflare Worker
├── packages/core/     # 解析、校验、稳定 ID 和导出逻辑
├── scripts/           # 交付文件打包
└── .github/workflows/ # GitHub CI（Cloudflare 由 Workers Builds 部署）
```

Chrome 扩展源码只在 [huades/PortPilot](https://github.com/huades/PortPilot) 中维护，本仓库不包含扩展源码。

## 隐私与限制

- 生成的 `mihomo.yaml` 含有上游连接凭据，应按敏感文件保管。
- `browser-profiles.json` 只含本地代理档案，但分享前仍建议检查内容。
- 首版不支持远程订阅抓取、账号系统、遥测，也不会自动控制 Mihomo/v2rayN 进程。
- Chrome 代理接口不能让扩展直接实现 VLESS/VMess/Trojan 传输。
- 当前解析器覆盖常见格式；服务商自定义字段或较新的协议字段可能仍需手工调整 Mihomo 配置。

## 许可证

仓库目前未包含许可证文件。在仓库所有者添加许可证前，源码可见不代表自动授予再分发权。
