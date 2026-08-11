# MultiPort-Proxy 多端口代理转换器

[English](README.md) · [PortPilot Chrome 扩展](https://github.com/huades/PortPilot)

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

### 方法一：GitHub Actions 自动部署（推荐）

#### 1. 准备 Cloudflare

1. 登录 Cloudflare，进入 **Account API Tokens → Create Token**。
2. 在 Custom 权限中选择 **Edit Cloudflare Workers**，只授权实际部署使用的账号。
3. 创建并立即复制 Token；离开页面后不能再次查看完整 Token。
4. 在 Cloudflare 账号主页复制 **Account ID**。这里需要的是账号 ID，不是 Zone ID。

#### 2. 配置 GitHub

进入 GitHub 仓库的 **Settings → Secrets and variables → Actions → New repository secret**，添加：

   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

不要把 Token 写入 YAML、README、`.env` 或提交记录。

#### 3. 首次部署

1. 打开 **Actions → Deploy web to Cloudflare**。
2. 点击 **Run workflow**，选择 `main` 后确认。
3. 工作流依次安装依赖、执行类型检查和测试、构建 Worker、发布到 Cloudflare。
4. 在 `Deploy Worker` 日志末尾复制生成的 `*.workers.dev` 地址。

此后，`main` 分支中 `apps/web`、`packages/core` 或根目录包文件发生变化时会自动部署。工作流先构建，再执行：

```powershell
npx wrangler deploy --config dist/server/wrangler.json
```

当前构建生成的 Worker 名称为 `multiport-web`，最终的 `*.workers.dev` 地址会显示在 Actions 部署日志中。

#### 4. 验证部署

打开部署地址后检查：中英文切换、示例解析、节点端口、YAML/JSON 预览和下载。Cloudflare 中可通过 **Workers & Pages → multiport-web → Deployments** 查看当前版本和部署历史。

### 方法二：本机命令行部署

```powershell
npm install
npm run build
npx wrangler login
cd apps/web
npx wrangler deploy --config dist/server/wrangler.json
```

不要直接修改 `dist/server/wrangler.json`，每次构建都会重新生成。部署完成后，如需绑定自己的域名，可在 Cloudflare 中打开该 Worker，再通过 **Domains** 页面添加 Custom Domain。

### 绑定域名与回滚

- 自定义域名：进入 **Workers & Pages → multiport-web → Settings → Domains & Routes → Add → Custom Domain**。域名必须属于同一 Cloudflare 账号，并且不能存在冲突的 CNAME。
- 回滚：进入 **Workers & Pages → multiport-web → Deployments**，在目标历史版本右侧菜单中选择 **Rollback**。也可以在 `apps/web` 目录运行 `npx wrangler rollback`。
- `workers.dev` 适合首次验证；正式用途建议绑定 Custom Domain 或 Worker Route。

Cloudflare 官方资料：[GitHub Actions 部署](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)、[Wrangler deploy](https://developers.cloudflare.com/workers/wrangler/commands/workers/#deploy)、[自定义域名](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)。

### 部署故障排查

- **鉴权失败：** 检查两个 GitHub Secrets；API Token 所属账号必须与 Account ID 一致。
- **找不到 `dist/server/wrangler.json`：** 先运行 `npm run build`，并确保在 `apps/web` 目录执行 Wrangler。
- **缺少 Linux Rolldown binding：** 保留工作流中显式安装 Linux binding 的步骤，用于规避 npm 可选依赖锁文件问题。
- **Worker 可访问但自定义域名不可用：** 确认域名已在同一 Cloudflare 账号激活，且不存在冲突的 CNAME 记录。
- **新版本部署后异常：** 在 Cloudflare 的 Worker 部署历史中回滚到已知可用版本。
- **GitHub 显示 Resource not accessible：** 确认工作流使用仓库级 Actions，并且仓库允许第三方 Action；本流程需要 `cloudflare/wrangler-action@v3`。
- **Secrets 看似存在但仍鉴权失败：** Secret 名称必须完全一致，值中不要包含引号或多余换行。

## 项目结构

```text
MultiPort-Proxy/
├── apps/web/          # 转换网页和 Cloudflare Worker
├── packages/core/     # 解析、校验、稳定 ID 和导出逻辑
├── scripts/           # 交付文件打包
└── .github/workflows/ # CI 与 Cloudflare 部署
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
