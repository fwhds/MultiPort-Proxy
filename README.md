# MultiPort-Proxy

[简体中文](README.zh-CN.md) · [PortPilot Chrome extension](https://github.com/huades/PortPilot)

MultiPort-Proxy locally converts Clash/Mihomo YAML or node share links into one-node-per-port Mihomo listeners and PortPilot browser profiles. Node data never leaves the browser.

## How to use

### 1. Enter nodes

Choose one input type:

- **Clash YAML:** paste or upload a complete configuration containing a `proxies:` array.
- **Node share links:** enter one `vless://`, `vmess://`, `trojan://`, `ss://`, `socks://`, or `http(s)://` link per line.

Remote subscription URLs are not fetched. Paste the subscription file contents or node share links copied from v2rayN.

### 2. Review the port mapping

1. Select **Parse nodes**.
2. Keep the required nodes selected.
3. Set the start port and listen address. The defaults are `8000` and `127.0.0.1`.
4. The default listener is **SOCKS5**; HTTP and mixed are also available.
5. Confirm that every selected node has a different local port.

### 3. Export the Mihomo YAML

Review and download `mihomo.yaml`, then run:

```powershell
mihomo.exe -f .\mihomo.yaml
```

This file is a snapshot of the current node format. Keep the original YAML or share links and regenerate the file if Mihomo or node formats change.

### 4. Export the PortPilot JSON

1. Download `browser-profiles.json`.
2. Load [PortPilot](https://github.com/huades/PortPilot) in Chrome developer mode.
3. Import the JSON and select a proxy profile.
4. Select **Direct** when the proxy is no longer needed.

The JSON contains local `127.0.0.1` profiles only. It excludes upstream UUIDs, passwords, and server addresses. Export and import it again whenever Mihomo ports change.

The page can copy or download either file, or download a ZIP containing both. The header switches between light/dark themes and Chinese/English.

## Deploy to Cloudflare Pages

### Deploy a fork with Git integration

1. Select **Fork** on GitHub.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
3. Select your fork and its `main` branch.
4. Use these settings:

| Setting | Value |
|---|---|
| Root directory | `/` |
| Build command | Leave blank, or use `npm run build` |
| Build output directory | `apps/web/dist/pages` |

The repository includes deployable static output, so a blank Build command works. Set it to `npm run build` if Cloudflare should regenerate the static output for every deployment.

A random Pages project name is supported. It does not need to match the repository name, and no environment variables are required.

### Fix a 404 deployment

Confirm that:

- the fork is synced with the latest upstream commit;
- the output directory is exactly `apps/web/dist/pages`;
- `apps/web/dist/client` is not being deployed;
- the Cloudflare application is a Pages project, not a Worker; and
- the latest commit was redeployed after changing the settings.

On the latest version, **No build command specified** is acceptable: Cloudflare deploys the committed static output directly.
