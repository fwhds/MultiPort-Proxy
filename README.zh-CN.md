# MultiPort-Proxy 多端口代理转换器

[English](README.md)

MultiPort-Proxy 是一款仅在本地浏览器处理数据的中英文网页工具，可将 Clash/Mihomo YAML 和常见节点分享链接转换成稳定的“一节点一端口” Mihomo listeners，同时导出不含节点密钥的 `browser-profiles.json`，供独立维护的 [PortPilot Chrome 扩展](https://github.com/huades/PortPilot) 导入。

## 目录结构

```text
MultiPort-Proxy/
├─ apps/web/          # 转换网页与 Cloudflare 应用
├─ packages/core/     # 解析、校验、稳定 ID 和导出逻辑
├─ scripts/           # 部署文件打包
└─ .github/workflows/ # CI 与 Cloudflare 部署
```

Chrome 扩展源码仅由 [huades/PortPilot](https://github.com/huades/PortPilot) 管理，本仓库不包含扩展源码。

## 开发与构建

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

网页构建后执行 `npm run package:deploy`，将生成 `release/multiport-proxy-cloudflare-source.zip` 与 `release/multiport-proxy-built-site.zip`。

## 使用流程

1. 粘贴 Clash/Mihomo YAML，或每行粘贴一个支持的分享链接。
2. 选择节点和 listener 设置。
3. 下载 `mihomo.yaml` 与 `browser-profiles.json`。
4. 启动 Mihomo，再将 JSON 导入 PortPilot。

所有解析均在浏览器本地完成。项目不包含账号、遥测、远程订阅抓取或密钥上传。生成的 YAML 应视为敏感文件；除非确实需要局域网访问，否则保持绑定 `127.0.0.1`。
