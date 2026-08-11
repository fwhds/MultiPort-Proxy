# MultiPort-Proxy

[简体中文](README.zh-CN.md) · [PortPilot Chrome extension](https://github.com/huades/PortPilot)

MultiPort-Proxy is a privacy-first web converter for creating deterministic, one-node-per-port Mihomo configurations. Paste a Clash/Mihomo YAML file or supported share links, select the nodes, and export both a runnable `mihomo.yaml` and a credential-free `browser-profiles.json` for PortPilot.

All parsing and generation happen locally in the browser. The site does not upload proxy credentials, fetch remote subscriptions, require an account, or control Mihomo/v2rayN processes.

## How it works

```text
Clash YAML / share links
          │
          ▼
 MultiPort-Proxy (browser-only parsing)
          │
          ├── mihomo.yaml ─────────────► Mihomo ─► 127.0.0.1:42000, 42001, ...
          │
          └── browser-profiles.json ───► PortPilot ─► Chrome proxy switching
```

The same nodes and start port always produce stable profile IDs and port mappings.

## Features

- Parses Clash/Mihomo YAML and multiline `vless://`, `vmess://`, `trojan://`, `ss://`, `socks://`, `http://`, and `https://` links.
- Creates one independent Mihomo `mixed`, `http`, or `socks` listener per selected node. A `mixed` listener exports both HTTP and SOCKS5 PortPilot profiles on the same local port.
- Preserves top-level DNS, proxy groups, and rules, and can generate a jump B → exit A `dialer-proxy` chain.
- Supports adding a node manually from a single-node YAML object.
- Defaults to `127.0.0.1`, port `42000`, and `mixed` listeners.
- Exports individual YAML/JSON files or one ZIP bundle.
- Supports Chinese/English switching in the web interface.
- Keeps upstream UUIDs, passwords, and server details out of the PortPilot JSON.

## Quick start

Requirements: Node.js 22+, npm 10+, and Mihomo for running the generated configuration. PortPilot is optional and is only needed for switching proxies in Chrome.

```powershell
git clone https://github.com/huades/MultiPort-Proxy.git
cd MultiPort-Proxy
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:3000`.

Useful commands:

```powershell
npm run typecheck     # TypeScript checks
npm test              # core parser/exporter tests
npm run build         # production Worker build
npm run lint          # ESLint checks
```

## User guide

### 1. Prepare node input

Use either:

- a local Clash/Mihomo YAML file; or
- share links copied/exported from v2rayN, one link per line.

In v2rayN, select the required servers and use the command that copies selected server share links to the clipboard. Menu wording can vary between versions. Do not paste a remote subscription URL: the MVP intentionally does not fetch subscriptions.

### 2. Parse and map nodes

1. Choose **Clash YAML** or **Share links**.
2. Paste the content, upload a local `.yaml`, `.yml`, or `.txt` file, then select **Parse nodes**.
3. Keep the nodes you want enabled.
4. Set the start port, listen host, and listener type. The recommended local settings are `42000`, `127.0.0.1`, and `mixed`.
5. Confirm that each selected node receives a different local port.

With `mixed`, each node appears twice in `browser-profiles.json`: one `[HTTP]` profile and one `[SOCKS5]` profile. They intentionally share the same port because a Mihomo mixed listener accepts both protocols.

Keep `127.0.0.1` unless you deliberately want other LAN devices to reach the listeners. Exposing listeners to the LAN may create an unauthenticated proxy endpoint.

### 3. Export and start Mihomo

Download `mihomo.yaml`, or use the ZIP download. Then start Mihomo from the directory containing the file:

```powershell
mihomo.exe -f .\mihomo.yaml
```

Leave Mihomo running. If it exits immediately, inspect its console output for unsupported node options, occupied ports, or malformed input.

### 4. Use the profiles in Chrome

1. Download `browser-profiles.json`.
2. Install/load the separate [PortPilot extension](https://github.com/huades/PortPilot) in Chrome developer mode.
3. Open PortPilot, import the JSON, and select a profile.
4. Run its connectivity or exit-IP check.
5. Select **Direct** in PortPilot to restore Chrome's normal network configuration.

PortPilot connects only to the local HTTP/SOCKS listeners. It does not connect directly to VLESS, VMess, or Trojan nodes; Mihomo performs that work.

## Deploy to Cloudflare Pages

The production build creates a real static Pages site at `apps/web/dist/pages`, including `index.html` and `404.html`. The committed `wrangler.jsonc` also declares that directory, so Cloudflare does not need automatic project configuration.

The Wrangler configuration declares `npm run build` as its build command. This is required for repository imports: without it Cloudflare reports “No build command specified,” skips the build, and then cannot find `apps/web/dist/pages`.

### Fork and connect GitHub

1. Select **Fork** on GitHub.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git**.
3. Select your fork and use these settings:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Root directory | `/` |
| Build command | `npm run build` |
| Build output directory | `apps/web/dist/pages` |

Do not use `apps/web/dist/client`; it does not contain the prerendered `index.html` and will return 404. No environment variables are required.

Cloudflare may assign a random Pages project name. That is supported and does not need to match the repository or the example name in `wrangler.jsonc`.

If Cloudflare imports the settings from `wrangler.jsonc`, confirm the build log shows `npm run build` instead of **No build command specified**. For an existing project, open **Settings → Builds & deployments**, set the Build command manually to `npm run build`, save, and retry the latest deployment.

### Direct upload with Wrangler

```powershell
npm install
npm run build
npx wrangler login
npx wrangler pages deploy apps/web/dist/pages --project-name <your-pages-project-name>
```

The deployed site uses a `*.pages.dev` address. Add a custom domain under the Pages project's **Custom domains** section. For a failed release, select a known-good deployment from **Deployments** and roll back.

### Troubleshooting

- **404 after a successful build:** set the output directory exactly to `apps/web/dist/pages`, then retry the deployment.
- **No build command specified:** update to the latest commit or set the Pages Build command to `npm run build` manually.
- **Repository is not listed:** allow the Cloudflare GitHub App to access the fork.
- **Linux native binding missing:** keep the root build command; its prebuild step installs the required Linux bindings.
- **Old content remains:** verify Cloudflare built the latest commit and clear the Pages build cache before retrying.

## Repository structure

```text
MultiPort-Proxy/
├── .github/workflows/ # GitHub CI checks
├── apps/web/          # converter UI and static Pages output
├── packages/core/     # parsers, validation, stable IDs, exporters
├── scripts/           # cross-platform build helpers
└── wrangler.jsonc     # committed Cloudflare Pages configuration
```

Chrome extension source is maintained exclusively in [huades/PortPilot](https://github.com/huades/PortPilot).

## Privacy and limitations

- Generated `mihomo.yaml` files contain upstream connection credentials and must be treated as secrets.
- `browser-profiles.json` contains only local proxy profiles, but review it before sharing.
- Remote subscription fetching, user accounts, telemetry, and automatic Mihomo/v2rayN process control are intentionally excluded.
- Browser extensions cannot implement VLESS/VMess/Trojan transports directly through Chrome proxy settings.
- Parsing support targets common formats; provider-specific or newer fields may still require manual Mihomo adjustments.

## License

No license file is currently included. Unless the repository owner adds one, source availability does not grant redistribution rights.
