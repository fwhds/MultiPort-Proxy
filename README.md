# MultiPort-Proxy

[简体中文](README.zh-CN.md)

MultiPort-Proxy is a local-only bilingual web tool that converts Clash/Mihomo YAML and common proxy share links into deterministic one-node-per-port Mihomo listeners. It also exports a credential-free `browser-profiles.json` for the separate [PortPilot Chrome extension](https://github.com/huades/PortPilot).

## Structure

```text
MultiPort-Proxy/
├─ apps/web/          # converter and Cloudflare application
├─ packages/core/     # parsers, validation, stable IDs, exporters
├─ scripts/           # deployment packaging
└─ .github/workflows/ # CI and Cloudflare deployment
```

Chrome extension source is maintained only in [huades/PortPilot](https://github.com/huades/PortPilot).

## Develop and build

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Run `npm run package:deploy` after building to create `release/multiport-proxy-cloudflare-source.zip` and `release/multiport-proxy-built-site.zip`.

## Usage

1. Paste Clash/Mihomo YAML or one supported share link per line.
2. Select nodes and listener settings.
3. Download `mihomo.yaml` and `browser-profiles.json`.
4. Start Mihomo, then import the JSON into PortPilot.

All parsing happens in the browser. The project has no account system, telemetry, remote subscription fetcher, or secret upload. Keep generated YAML private and bind listeners to `127.0.0.1` unless LAN access is intentional.
